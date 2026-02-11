from presidio_anonymizer.entities import OperatorConfig

from app.infrastructure.policies import to_operator_config


def test_to_operator_config_creates_operator_objects():
    policy = {
        "default": {"type": "replace", "new_value": "[REDACTED]"},
        "EMAIL_ADDRESS": {"type": "mask", "chars_to_mask": 4, "from_end": True},
    }

    operators = to_operator_config(policy)

    assert set(operators.keys()) == {"default", "EMAIL_ADDRESS"}
    assert isinstance(operators["default"], OperatorConfig)
    assert operators["default"].operator_name == "replace"
    assert operators["default"].params == {"new_value": "[REDACTED]"}


def test_to_operator_config_requires_type_field():
    policy = {"default": {"new_value": "value without type"}}

    try:
        to_operator_config(policy)
    except ValueError as exc:
        assert "'type'" in str(exc)
    else:
        raise AssertionError("Expected ValueError when policy entry lacks a 'type'")
