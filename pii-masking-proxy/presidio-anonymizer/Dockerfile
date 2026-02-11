FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt dev-requirements.txt ./
RUN apt-get update && apt-get install -y --no-install-recommends build-essential wget ca-certificates python3-pip python3-pybind11 cmake \
    && rm -rf /var/lib/apt/lists/* \
    && python3 -m pip install --upgrade pip pybind11 \
    # && pip install --no-cache-dir fasttext-wheel --no-build-isolation \
    && pip install --no-cache-dir -r requirements.txt -r dev-requirements.txt \
    && python -m spacy download ru_core_news_lg \
    && python -m spacy download en_core_web_lg
COPY . /app
EXPOSE 8000
# Optional: mount fastText model and set FASTTEXT_MODEL=/models/lid.176.bin
ENV FASTTEXT_MODEL=""
ENV ANALYZER_CONF_FILE="/app/app/conf/default_analyzer.yaml"
ENV RECOGNIZER_REGISTRY_CONF_FILE="/app/app/conf/default_recognizers.yaml"
ENV NLP_CONF_FILE="/app/app/conf/default.yaml"

CMD ["gunicorn", "-b", "0.0.0.0:8000", "app.interface.api:app"]