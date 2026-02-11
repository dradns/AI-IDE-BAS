import logging
from inspect import signature
import os
from typing import Any, Dict

from flask import Flask, request, jsonify
from werkzeug.exceptions import BadRequest, InternalServerError

from presidio_anonymizer import AnonymizerEngine
from presidio_analyzer import AnalyzerEngineProvider

from app.application.lang_detect import detect_language
from app.application.service import (
    get_analyzer,
    get_anonymizer,
    post_validate,
    runtime_status,
)
from app.infrastructure.policies import get_default_policy, to_operator_config

from app.infrastructure.recognizers import build_generic_recognizers, build_ru_bank_recognizers, build_ru_critical_recognizers

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False

analyzer_engine = AnalyzerEngineProvider(
    os.environ.get("ANALYZER_CONF_FILE"),
    os.environ.get("NLP_CONF_FILE"),
    os.environ.get("RECOGNIZER_REGISTRY_CONF_FILE")
).create_engine()
for recognizer in (
    build_generic_recognizers()
    + build_ru_critical_recognizers()
    + build_ru_bank_recognizers()
):
    analyzer_engine.registry.add_recognizer(recognizer)

anonymizer_engine = AnonymizerEngine()

logger = logging.getLogger(__name__)

_ANONYMIZER_SUPPORTS_OPERATORS = (
    "operators" in signature(AnonymizerEngine.anonymize).parameters
)


@app.route("/health", methods=["GET"])
def health() -> Dict[str, Any]:
    status = runtime_status()
    overall = "ok"

    if status["nlp"].get("fallback_used"):
        overall = "degraded"
    elif not status["nlp"].get("initialized"):
        overall = "cold_start"

    return jsonify({"status": overall, **status})


# @app.route("/analyze", methods=["POST"])
# def analyze_endpoint():
#     data = request.get_json(force=True)

#     text = data.get("text")
#     language = data.get("language")

#     if not text:
#         raise BadRequest("Field 'text' is required")

#     # try:
#     #     detection = detect_language(text, explicit_language=language)
#     # except ValueError as exc:
#     #     raise BadRequest(str(exc))

#     try:
#         # language = detection.language
#         language = "en"  # forced like in your original code

#         logger.info(
#             "Analyze called with language %s via %s",
#             language,
#             # detection.method,
#         )

#         raw_results = analyzer_engine.analyze(
#             text=text,
#             language=language,
#         )

#         results = post_validate(text, raw_results)

#         items = [
#             {
#                 "entity_type": r.entity_type,
#                 "start": r.start,
#                 "end": r.end,
#                 "text": text[r.start : r.end],
#                 "score": r.score,
#             }
#             for r in results
#         ]

#         return jsonify(items)

#     except Exception as exc:
#         logger.exception("Analyze failed")
#         raise InternalServerError(str(exc))


@app.route("/anonymize", methods=["POST"])
def anonymize_endpoint():
    data = request.get_json(force=True)

    text = data.get("text")
    # language = data.get("language")
    policy_override = data.get("policy")
    # results = data.get("analyzer_results")

    if not text:
        raise BadRequest("Field 'text' is required")

    # try:
    #     detection = detect_language(text, explicit_language=language)
    # except ValueError as exc:
    #     raise BadRequest(str(exc))

    try:
        # language = detection.language
        language = "ru"  # forced like in your original code

        logger.info(
            "Anonymize called with language %s via %s",
            language,
            # detection.method,
        )

        raw_results = analyzer_engine.analyze(
            text=text,
            language=language,
        )

        results = post_validate(text, raw_results)

        policy = {**get_default_policy(), **(policy_override or {})}

        if _ANONYMIZER_SUPPORTS_OPERATORS:
            # operators = to_operator_config(policy)
            anonymized = anonymizer_engine.anonymize(
                text=text,
                analyzer_results=results,
                # operators=operators,
            )
        else:
            anonymized = anonymizer_engine.anonymize(
                text=text,
                analyzer_results=results,
                # anonymizers_config=policy,
            )

        items = [
            {
                "entity_type": r.entity_type,
                "start": r.start,
                "end": r.end,
                "text": text[r.start: r.end],
                "score": r.score,
                "operator": "replace",
            }
            for r in results
        ]

        return jsonify(
            {
                "text": anonymized.text,
                "items": items,
            }
        )

    except Exception as exc:
        logger.exception("Anonymize failed")
        raise InternalServerError(str(exc))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
