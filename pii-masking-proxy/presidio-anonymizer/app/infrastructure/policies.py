# Policies placeholder
from typing import Any, Dict

import copy

from presidio_anonymizer.entities import OperatorConfig

from app.config import DEFAULT_POLICY


def get_default_policy() -> Dict[str, Dict[str, Any]]:
    """Return a copy of the default anonymization policy."""
    return copy.deepcopy(DEFAULT_POLICY)


def to_operator_config(policy: Dict[str, Dict[str, Any]]) -> Dict[str, OperatorConfig]:
    """Convert a policy mapping to Presidio anonymizer operator configs.

    The Presidio anonymizer v3 API expects ``OperatorConfig`` instances provided via
    the ``operators`` argument. Historically the service passed raw dictionaries via
    the deprecated ``anonymizers_config`` argument. Upgrading to the new API requires
    transforming the user/configured policy dictionaries into ``OperatorConfig``
    objects while keeping the remaining parameters intact.
    """

    operators: Dict[str, OperatorConfig] = {}
    for name, cfg in policy.items():
        if not isinstance(cfg, dict):
            raise TypeError(f"Policy config for '{name}' must be a dict, got {type(cfg)!r}")

        params = dict(cfg)  # shallow copy so we can pop "type"
        operator_type = params.pop("type", None)
        if not operator_type:
            raise ValueError(f"Policy config for '{name}' must include a 'type' field")

        operators[name] = OperatorConfig(operator_name=operator_type, params=params)

    return operators
