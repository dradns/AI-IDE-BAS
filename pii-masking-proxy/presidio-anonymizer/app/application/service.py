# Service placeholder
import logging
import re
from typing import List

from presidio_analyzer import AnalyzerEngine, RecognizerRegistry, RecognizerResult
from presidio_anonymizer import AnonymizerEngine

from app.infrastructure.nlp import create_nlp_engine, nlp_status
from app.infrastructure.recognizers import (
    build_generic_recognizers,
    build_ru_bank_recognizers,
    build_ru_critical_recognizers,
)
from app.domain.validators import (
    luhn_ok,
    snils_checksum_ok,
    inn_checksum_ok,
    ogrn_checksum_ok,
    bik_ok,
    account_checksum_ok,
    find_all_biks,
)
from app.domain import entities as E

logger = logging.getLogger(__name__)

_nlp_engine = None
_registry = None
_analyzer = None
_anonymizer = None


def _ensure_nlp_engine():
    global _nlp_engine
    if _nlp_engine is None:
        logger.info("Initializing NLP engine")
        _nlp_engine = create_nlp_engine()
    return _nlp_engine


def _ensure_registry():
    global _registry
    if _registry is None:
        logger.info("Initializing recognizer registry")
        _registry = RecognizerRegistry()
        _registry.load_predefined_recognizers(nlp_engine=_ensure_nlp_engine())
        # for recognizer in (
            # build_generic_recognizers()
        #     + build_ru_critical_recognizers()
        #     + build_ru_bank_recognizers()
        # ):
        #     _registry.add_recognizer(recognizer)
    return _registry


def get_analyzer() -> AnalyzerEngine:
    global _analyzer
    if _analyzer is None:
        logger.info("Initializing analyzer engine")
        _analyzer = AnalyzerEngine(
            nlp_engine=_ensure_nlp_engine(),
            registry=_ensure_registry(),
            supported_languages=["en"],
        )
    return _analyzer


def get_anonymizer() -> AnonymizerEngine:
    global _anonymizer
    if _anonymizer is None:
        logger.info("Initializing anonymizer engine")
        _anonymizer = AnonymizerEngine()
    return _anonymizer


def runtime_status() -> dict:
    """Return current initialization/fallback status for service dependencies."""

    return {
        "analyzer_initialized": _analyzer is not None,
        "anonymizer_initialized": _anonymizer is not None,
        "nlp": nlp_status(),
    }

def post_validate(text: str, results: List[RecognizerResult]) -> List[RecognizerResult]:
    """Apply checksum/context validation and dedupe results."""
    validated: List[RecognizerResult] = []
    biks_in_text = [b for b in find_all_biks(text) if bik_ok(b)]
    email_spans = [
        (r.start, r.end) for r in results if r.entity_type == E.EMAIL
    ]

    for r in results:
        et = r.entity_type
        span = text[r.start:r.end]

        # Filter noisy low-score ML entities
        if et in {E.PERSON, E.ORG, E.LOC, E.GPE} and (r.score is not None and r.score < 0.55):
            continue

        # Structured checks
        if et == E.RU_SNILS and not snils_checksum_ok(span):
            continue
        if et == E.RU_INN and not inn_checksum_ok(span):
            continue
        if et in {E.RU_OGRN, E.RU_OGRNIP} and not ogrn_checksum_ok(span):
            continue
        if et == E.CARD and not luhn_ok(span):
            continue
        if et == "URL":
            overlaps_email = any(
                not (r.end <= s or r.start >= e) for s, e in email_spans
            )
            if "@" in span or overlaps_email:
                continue
        if et in {E.PHONE, E.PHONE_RU}:
            digits = "".join(ch for ch in span if ch.isdigit())
            window = text[max(0, r.start - 16) : min(len(text), r.end + 16)].lower()
            has_phone_keyword = bool(
                re.search(r"\b(phone|tel|mobile|cell|тел|телефон|моб)\b", window)
            )

            has_prefix = span.strip().startswith(("+", "00"))
            has_ru_domestic_prefix = digits.startswith("8") and len(digits) == 11

            if not (has_prefix or has_ru_domestic_prefix or has_phone_keyword):
                continue
        if et == "US_DRIVER_LICENSE":
            continue
        if et == E.RU_PASSPORT:
            digits = ''.join(ch for ch in span if ch.isdigit())
            if len(digits) != 10 or set(digits) == {"0"}:
                continue

            # Drop spurious passport matches that only fit the digit pattern but
            # lack nearby passport context (e.g. misfired on INN numbers).
            window = text[max(0, r.start - 24): min(len(text), r.end + 16)].lower()
            if "паспорт" not in window and "passport" not in window:
                continue
        if et in {E.RU_RS, E.RU_KS}:
            if not biks_in_text:
                continue
            is_corr = (et == E.RU_KS)
            if not any(account_checksum_ok(span, b, is_corr=is_corr) for b in biks_in_text):
                continue
        if et == E.RU_BIK and not bik_ok(span):
            continue

        validated.append(r)

    # dedupe by (start, end, type)
    seen, out = set(), []
    for r in validated:
        key = (r.start, r.end, r.entity_type)
        if key in seen:
            continue
        seen.add(key)
        out.append(r)
    return out
