"""NLP engine helpers."""

import logging
from typing import Optional, Set

import spacy
from presidio_analyzer.nlp_engine import NlpEngine, NlpEngineProvider
from presidio_analyzer.nlp_engine.spacy_nlp_engine import SpacyNlpEngine

from app.config import NLP_CONFIG

logger = logging.getLogger(__name__)

FALLBACK_USED = False
FALLBACK_REASON: Optional[str] = None
INITIALIZED = False


def _blank_spacy_engine(languages: Set[str]) -> NlpEngine:
    """Create a spaCy NLP engine backed by blank language pipelines."""

    engine = SpacyNlpEngine(
        models=[{"lang_code": lang, "model_name": f"blank_{lang}"} for lang in sorted(languages)]
    )
    engine.nlp = {lang: spacy.blank(lang) for lang in languages}
    return engine


def create_nlp_engine() -> NlpEngine:
    """Create and return the spaCy-based NLP engine for Presidio."""

    global INITIALIZED, FALLBACK_USED, FALLBACK_REASON

    provider = NlpEngineProvider(nlp_configuration=NLP_CONFIG)
    try:
        engine = provider.create_engine()
        INITIALIZED = True
        return engine
    except Exception as exc:  # pragma: no cover - fallback path depends on env
        logger.warning("Falling back to blank spaCy models: %s", exc)
        FALLBACK_USED = True
        FALLBACK_REASON = str(exc)
        languages = {model["lang_code"] for model in NLP_CONFIG.get("models", [])}
        if not languages:
            languages = {"ru", "en"}
        engine = _blank_spacy_engine(languages)
        INITIALIZED = True
        return engine


def nlp_status() -> dict:
    """Return runtime status for the NLP engine/fallbacks."""

    return {
        "initialized": INITIALIZED,
        "fallback_used": FALLBACK_USED,
        "fallback_reason": FALLBACK_REASON,
    }
