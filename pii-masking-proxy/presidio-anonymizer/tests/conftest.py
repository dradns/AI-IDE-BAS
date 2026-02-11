import pathlib
import sys

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

import pytest

try:
    from fastapi.testclient import TestClient  # type: ignore
except RuntimeError as exc:  # pragma: no cover - dependency missing in CI image
    TestClient = None  # type: ignore
    _test_client_error = exc
else:
    _test_client_error = None


@pytest.fixture(scope="session")
def client():
    if _test_client_error is not None or TestClient is None:
        pytest.skip(f"FastAPI TestClient unavailable: {_test_client_error}")

    from app.interface.api import app

    return TestClient(app)
