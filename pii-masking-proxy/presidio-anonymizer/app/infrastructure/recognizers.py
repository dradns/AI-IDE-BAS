# Recognizers placeholder
from typing import List

from presidio_analyzer import Pattern, PatternRecognizer

from app.domain import entities as E

_SURNAME_SUFFIXES = (
    "ов",
    "ова",
    "ев",
    "ева",
    "ёв",
    "ёва",
    "ин",
    "ина",
    "ын",
    "ына",
    "ский",
    "ская",
    "цкий",
    "цкая",
    "ской",
    "цкой",
    "кий",
    "кая",
    "ко",
    "енко",
    "ук",
    "юк",
    "чук",
    "щук",
    "нюк",
    "ян",
    "иан",
    "янц",
    "дзе",
    "швили",
    "ашвили",
)

_PATRONYMIC_SUFFIXES = (
    "ович",
    "евич",
    "вич",
    "овна",
    "евна",
    "ична",
    "вна",
    "оглы",
    "кызы",
    "улы",
    "гулы",
    "уулу",
    "кизи",
    "ич",
)

_SURNAME_SUFFIX_REGEX = "(?:" + "|".join(_SURNAME_SUFFIXES) + ")"
_PATRONYMIC_SUFFIX_REGEX = "(?:" + "|".join(_PATRONYMIC_SUFFIXES) + ")"
_SURNAME_PATTERN = rf"[А-ЯЁ][а-яё]+?(?:-[А-ЯЁ][а-яё]+?)*{_SURNAME_SUFFIX_REGEX}"
_PATRONYMIC_PATTERN = rf"[А-ЯЁ][а-яё]+?{_PATRONYMIC_SUFFIX_REGEX}"
_RU_FIO_THREE = rf"\b{_SURNAME_PATTERN}\s+[А-ЯЁ][а-яё]+\s+{_PATRONYMIC_PATTERN}\b"
_RU_FIO_TWO = rf"\b{_SURNAME_PATTERN}\s+[А-ЯЁ][а-яё]+\b"
_RU_FIO_REVERSED = rf"\b[А-ЯЁ][а-яё]+\s+{_SURNAME_PATTERN}\b"


def build_ru_critical_recognizers() -> List[PatternRecognizer]:
    recs: List[PatternRecognizer] = []

    # Passport (series 4 digits + number 6 digits)
    passport_context = ["паспорт", "passport", "серия", "номер", "number"]
    for lang in ("ru", "en"):
        recs.append(PatternRecognizer(
            supported_entity=E.RU_PASSPORT,
            patterns=[Pattern("russian_passport", r"\b\d{2}\s?\d{2}\s?\d{6}\b", 0.3)],
            context=passport_context,
            supported_language=lang,
        ))

    # Russian full name (ФИО)
    recs.append(PatternRecognizer(
        supported_entity=E.PERSON,
        patterns=[
            Pattern("ru_fio_three", _RU_FIO_THREE, 0.9),
            Pattern("ru_fio_two", _RU_FIO_TWO, 0.75),
            Pattern("ru_fio_reversed", _RU_FIO_REVERSED, 0.6),
        ],
        context=[
            "гражданин",
            "клиент",
            "сотрудник",
            "ФИО",
            "фио",
        ],
        supported_language="ru",
        global_regex_flags=0,
    ))

    # SNILS
    recs.append(PatternRecognizer(
        supported_entity=E.RU_SNILS,
        patterns=[
            Pattern("snils_hyphen", r"\b\d{3}-\d{3}-\d{3}\s?\d{2}\b", 0.2),
            Pattern("snils_compact", r"(?<!\d)\d{11}(?!\d)", 0.05),
        ],
        context=["снилс"],
        supported_language="ru",
    ))

    # INN
    recs.append(PatternRecognizer(
        supported_entity=E.RU_INN,
        patterns=[Pattern("inn_10_12", r"(?<!\d)(?:\d{10}|\d{12})(?!\d)", 0.2)],
        context=["инн"],
        supported_language="ru",
    ))

    # OGRN/OGRNIP
    recs.append(PatternRecognizer(
        supported_entity=E.RU_OGRN,
        patterns=[Pattern("ogrn_13", r"(?<!\d)\d{13}(?!\d)", 0.15)],
        context=["огрн"],
        supported_language="ru",
    ))
    recs.append(PatternRecognizer(
        supported_entity=E.RU_OGRNIP,
        patterns=[Pattern("ogrnip_15", r"(?<!\d)\d{15}(?!\d)", 0.15)],
        context=["огрнип"],
        supported_language="ru",
    ))

    # Phone (RU)
    phone_ru_patterns = [
        Pattern(
            "phone_ru",
            r"(?<!\d)(?:\+7|8)\s*\(?\d{3}\)?[\s\u00A0-]*\d{3}[\s\u00A0-]*\d{2}[\s\u00A0-]*\d{2}(?!\d)",
            0.7,
        ),
        Pattern(
            "phone_ru_compact",
            r"(?<!\d)(?:\+7|8)[\s\u00A0-]*\d{10}(?!\d)",
            0.55,
        ),
    ]
    for lang in ("ru", "en"):
        recs.append(
            PatternRecognizer(
                supported_entity=E.PHONE_RU,
                patterns=phone_ru_patterns,
                context=["тел", "моб", "телефон", "phone", "tel"],
                supported_language=lang,
            )
        )

    # Email
    email_pattern = Pattern(
        "email_simple",
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        0.2,
    )
    for lang in ("ru", "en"):
        recs.append(
            PatternRecognizer(
                supported_entity=E.EMAIL,
                patterns=[email_pattern],
                context=["email", "e-mail", "почта"],
                supported_language=lang,
            )
        )

    # Card PAN (13-19 digits) — needs Luhn in post-validation
    card_pattern = Pattern("card_pan", r"\b(?:\d[ -]?){13,19}\b", 0.1)
    for lang in ("ru", "en"):
        recs.append(
            PatternRecognizer(
                supported_entity=E.CARD,
                patterns=[card_pattern],
                context=["card", "карта", "visa", "mastercard"],
                supported_language=lang,
            )
        )

    return recs


def build_generic_recognizers() -> List[PatternRecognizer]:
    """Recognizers that should work across supported languages."""

    recs: List[PatternRecognizer] = []

    phone_generic = Pattern(
        "phone_international",
        r"(?<!\d)(?=(?:.*[\s\u00A0-]){2,})(?:\+\d{1,3}|00\d{1,3})[\s\u00A0-]?(?:\(?\d{2,4}\)?[\s\u00A0-]?){2,4}\d{2,4}(?!\d)",
        0.5,
    )

    for lang in ("en", "ru"):
        recs.append(
            PatternRecognizer(
                supported_entity=E.PHONE,
                patterns=[phone_generic],
                context=["phone", "tel", "mobile", "cell", "тел", "телефон", "моб"],
                supported_language=lang,
            )
        )

    return recs


def build_ru_bank_recognizers() -> List[PatternRecognizer]:
    recs: List[PatternRecognizer] = []

    # BIK (9 digits)
    recs.append(PatternRecognizer(
        supported_entity=E.RU_BIK,
        patterns=[Pattern("bik_9", r"(?<![0-9])[0-9]{9}(?![0-9])", 0.1)],
        context=["бик"],
        supported_language="ru",
    ))

    # r/s (settlement account, 20 digits)
    recs.append(PatternRecognizer(
        supported_entity=E.RU_RS,
        patterns=[Pattern("rs_20", r"(?<![0-9])[0-9]{20}(?![0-9])", 0.05)],
        context=["р/с", "расчет", "расчёт", "счет", "счёт"],
        supported_language="ru",
    ))

    # k/s (correspondent account, 20 digits)
    recs.append(PatternRecognizer(
        supported_entity=E.RU_KS,
        patterns=[Pattern("ks_20", r"(?<![0-9])[0-9]{20}(?![0-9])", 0.05)],
        context=["к/с", "корр", "корреспондентский"],
        supported_language="ru",
    ))

    return recs
