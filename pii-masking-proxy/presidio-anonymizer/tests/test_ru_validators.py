import re

RU_SAMPLE = (
    "Иван Петров, ИНН 500100732259, СНИЛС 112-233-445 95, "
    "паспорт 45 08 123456, БИК 044525225, р/с 40702810900000000001, "
    "к/с 30101810400000000225, карта 4111 1111 1111 1111."
)


def test_ru_phone_number_is_detected(client):
    resp = client.post(
        "/analyze",
        json={"text": "телефон +7 (912) 000-00-00", "language": "ru"},
    )
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert any(item["entity_type"] == "PHONE_NUMBER_RU" for item in items)


def test_ru_phone_detected_inside_larger_text(client):
    text = (
        "Иван Иванов, паспорт 4012 345678 выдан 12.03.2015, телефон +7 (912) "
        "000-00-00"
    )

    resp = client.post("/analyze", json={"text": text, "language": "ru"})
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert any(item["entity_type"] == "PHONE_NUMBER_RU" for item in items)


def test_ru_phone_with_non_breaking_spaces(client):
    text = "телефон +7\u00A0(912)\u00A0000\u00A0\u00A000\u00A0\u00A000"

    resp = client.post("/analyze", json={"text": text, "language": "ru"})
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert any(item["entity_type"] == "PHONE_NUMBER_RU" for item in items)

def test_analyze_and_anonymize(client):
    # Analyze
    resp = client.post("/analyze", json={"text": RU_SAMPLE, "language": "ru"})
    assert resp.status_code == 200
    items = resp.json()["items"]
    types = {i["entity_type"] for i in items}
    assert {"RU_PASSPORT", "RU_INN", "RU_SNILS"}.issubset(types)

    # Anonymize
    resp2 = client.post("/anonymize", json={"text": RU_SAMPLE, "language": "ru"})
    assert resp2.status_code == 200
    text = resp2.json()["text"]
    # ensure critical numbers are masked/replaced
    assert "500100732259" not in text
    assert re.search(r"\d{2}\s?\d{2}\s?\d{6}", text) is None


def test_generic_phone_numbers_are_detected_and_masked(client):
    text = "Call me at +1 (415) 555-2671 or +44 20 7946 0958 tomorrow."

    analyze = client.post("/analyze", json={"text": text, "language": "en"})
    assert analyze.status_code == 200
    items = analyze.json()["items"]
    assert any(item["entity_type"] == "PHONE_NUMBER" for item in items)

    anonymize = client.post("/anonymize", json={"text": text, "language": "en"})
    assert anonymize.status_code == 200
    masked_text = anonymize.json()["text"]
    assert "+1 (415) 555-2671" not in masked_text
    assert "+44 20 7946 0958" not in masked_text


def test_international_phone_in_russian_text_detected_and_masked(client):
    text = (
        "Иван Иванов, паспорт 4012 345678 выдан 12.03.2015, телефон +90 531 123 4567"
    )

    analyze = client.post("/analyze", json={"text": text, "language": "ru"})
    assert analyze.status_code == 200
    items = analyze.json()["items"]
    assert any(item["entity_type"] == "PHONE_NUMBER" for item in items)

    anonymize = client.post("/anonymize", json={"text": text, "language": "ru"})
    assert anonymize.status_code == 200
    masked_text = anonymize.json()["text"]
    assert "+90 531 123 4567" not in masked_text


def test_ru_phone_is_detected_in_english_text(client):
    text = "Contact me at +7 (912) 000-00-00 for details"

    analyze = client.post("/analyze", json={"text": text, "language": "en"})
    assert analyze.status_code == 200
    items = analyze.json()["items"]
    assert any(
        item["entity_type"] in {"PHONE_NUMBER_RU", "PHONE_NUMBER"}
        for item in items
    )

    anonymize = client.post("/anonymize", json={"text": text, "language": "en"})
    assert anonymize.status_code == 200
    masked_text = anonymize.json()["text"]
    assert "+7 (912) 000-00-00" not in masked_text


def test_person_recognizer_detects_names(client):
    resp = client.post(
        "/analyze",
        json={"text": "Неводчикова Анастасия Анреевна", "language": "ru"},
    )
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert any(item["entity_type"] == "PERSON" for item in items)


def test_person_recognizer_rejects_nouns(client):
    resp = client.post(
        "/analyze",
        json={"text": "Коробка Стол Стул", "language": "ru"},
    )
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert all(item["entity_type"] != "PERSON" for item in items)


def test_full_ru_payload_has_all_key_entities(client):
    text = (
        "Иванов Иван Иванович из Москвы (ООО \"Контур\"), паспорт 4012 345678, "
        "СНИЛС 123-456-789 01, ИНН 7736050003, ОГРН 1027700132195, "
        "ОГРНИП 304500116000157, БИК 044525225, р/с 40702810900000001234, "
        "к/с 30101810400000000225, телефон +7 (912) 000-00-00 и +90 531 123 4567, "
        "email ivan.ivanov@example.com, карта 4111 1111 1111 1111."
    )

    resp = client.post("/analyze", json={"text": text, "language": "ru"})
    assert resp.status_code == 200
    items = resp.json()["items"]
    types = {i["entity_type"] for i in items}

    assert {"PERSON", "RU_PASSPORT", "RU_INN", "RU_OGRN", "RU_OGRNIP"}.issubset(types)
    assert {"PHONE_NUMBER_RU", "PHONE_NUMBER", "EMAIL_ADDRESS"}.issubset(types)

    # We should only keep the real passport (the INN should not be misclassified as one).
    passport_spans = [
        (i["start"], i["end"]) for i in items if i["entity_type"] == "RU_PASSPORT"
    ]
    assert len(passport_spans) == 1


def test_passport_is_not_misclassified_as_phone_in_english_text(client):
    text = (
        "John Doe from London (Contoso Ltd), passport number 4012 345678, "
        "email john.doe@example.com, phones +7 (912) 000-00-00 and +44 20 7946 "
        "0958, credit card 4111 1111 1111 1111."
    )

    resp = client.post("/analyze", json={"text": text, "language": "en"})
    assert resp.status_code == 200
    items = resp.json()["items"]

    # Passport should be detected as a passport, not as a phone number or license.
    assert any(
        i["entity_type"] == "RU_PASSPORT" and i["text"] == "4012 345678"
        for i in items
    )
    assert not any(
        i["entity_type"] in {"PHONE_NUMBER", "PHONE_NUMBER_RU"}
        and i["text"] == "4012 345678"
        for i in items
    )
    assert not any(i["entity_type"] == "US_DRIVER_LICENSE" for i in items)

    # Email should not be split into URL fragments.
    assert any(i["entity_type"] == "EMAIL_ADDRESS" for i in items)
    assert not any(i["entity_type"] == "URL" for i in items)

    # Real phone numbers should still be returned.
    assert any(i["entity_type"] in {"PHONE_NUMBER_RU", "PHONE_NUMBER"} and "+7" in i["text"] for i in items)
    assert any(i["entity_type"] == "PHONE_NUMBER" and "+44" in i["text"] for i in items)
