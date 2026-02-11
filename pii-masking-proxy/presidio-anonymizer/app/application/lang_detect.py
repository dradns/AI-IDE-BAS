"""Language detection utilities."""

from __future__ import annotations

import importlib
import logging
import os
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


_FASTTEXT_MODEL = None
_FASTTEXT_PATH: Optional[str] = None
_FASTTEXT_FAILED = False


@dataclass(frozen=True)
class LanguageDetection:
    """Result of a language detection attempt."""

    language: str
    method: str
    confidence: Optional[float] = None


def _load_fasttext_model(path: str):
    """Load and cache a fastText model if available."""

    global _FASTTEXT_MODEL, _FASTTEXT_PATH, _FASTTEXT_FAILED

    if _FASTTEXT_MODEL is not None or _FASTTEXT_FAILED:
        return _FASTTEXT_MODEL

    if not path or not os.path.exists(path):
        _FASTTEXT_FAILED = True
        return None

    spec = importlib.util.find_spec("fasttext")
    if spec is None:
        logger.info("FASTTEXT_MODEL is set but fasttext is not installed; skipping fastText detection")
        _FASTTEXT_FAILED = True
        return None

    fasttext = importlib.import_module("fasttext")  # type: ignore
    try:
        _FASTTEXT_MODEL = fasttext.load_model(path)
        _FASTTEXT_PATH = path
        logger.info("Loaded fastText model from %s", path)
    except Exception as exc:  # pragma: no cover - depends on runtime model availability
        _FASTTEXT_FAILED = True
        logger.warning("Failed to load fastText model from %s: %s", path, exc)

    return _FASTTEXT_MODEL


def _fasttext_predict(text: str) -> Optional[LanguageDetection]:
    model_path = os.getenv("FASTTEXT_MODEL")
    model = _load_fasttext_model(model_path) if model_path else None
    if not model:
        return None

    cleaned = text.replace("\n", " ")[:2000]
    labels, probs = model.predict(cleaned)
    label = labels[0]
    lang = label.split("__label__")[-1]
    prob = probs[0] if probs else None

    if lang.startswith("ru"):
        return LanguageDetection(language="ru", method="fasttext", confidence=prob)
    if lang.startswith("en"):
        return LanguageDetection(language="en", method="fasttext", confidence=prob)
    logger.info("fastText returned unsupported language '%s' (confidence %.3f)", lang, prob or -1)
    return None


def _langdetect_predict(text: str) -> Optional[LanguageDetection]:
    spec = importlib.util.find_spec("langdetect")
    if spec is None:
        logger.debug("langdetect not available; skipping fallback")
        return None

    detect = importlib.import_module("langdetect").detect  # type: ignore

    try:
        lang = detect(text)
    except Exception as exc:  # pragma: no cover - depends on langdetect internal state
        logger.info("langdetect failed with %s", exc)
        return None

    if lang in {"ru", "en"}:
        return LanguageDetection(language=lang, method="langdetect")

    logger.info("langdetect returned unsupported language '%s'", lang)
    return None


def _heuristic_predict(text: str) -> LanguageDetection:
    has_cyrillic = any("\u0400" <= ch <= "\u04FF" for ch in text)
    return LanguageDetection(language="ru" if has_cyrillic else "en", method="heuristic")


def detect_language(text: str, explicit_language: Optional[str] = None) -> LanguageDetection:
    """Detect language 'ru' or 'en', honoring an explicitly provided value."""

    if explicit_language:
        lang = explicit_language.lower()
        if lang not in {"ru", "en"}:
            raise ValueError(f"Unsupported language '{explicit_language}'. Only 'ru' or 'en' are allowed")
        logger.info("Language forced by request: %s", lang)
        return LanguageDetection(language=lang, method="explicit")

    # 1) fastText if FASTTEXT_MODEL provided (e.g. /models/lid.176.bin)
    fasttext_detection = _fasttext_predict(text)
    if fasttext_detection:
        logger.info(
            "Language detected via fastText: %s (confidence=%s) using model %s",
            fasttext_detection.language,
            f"{fasttext_detection.confidence:.3f}" if fasttext_detection.confidence is not None else "n/a",
            _FASTTEXT_PATH,
        )
        return fasttext_detection

    # 2) langdetect fallback
    langdetect_detection = _langdetect_predict(text)
    if langdetect_detection:
        logger.info("Language detected via langdetect: %s", langdetect_detection.language)
        return langdetect_detection

    # 3) script heuristic
    heuristic_detection = _heuristic_predict(text)
    logger.info("Language selected via heuristic: %s", heuristic_detection.language)
    return heuristic_detection
