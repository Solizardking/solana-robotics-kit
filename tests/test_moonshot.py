"""Unit tests for packages.moonshot (no live API calls)."""

from packages.moonshot import (
    SOL_GPT_TOOL_TOTALS,
    get_moonshot_api_key,
    is_moonshot_configured,
    moonshot_health_snapshot,
    moonshot_key_source,
    resolve_moonshot_model,
    KimiClient,
)


def test_key_resolution_prefers_kimi():
    env = {"KIMI_API_KEY": "sk-kimi", "MOONSHOT_API_KEY": "sk-moon"}
    assert get_moonshot_api_key(env) == "sk-kimi"
    assert moonshot_key_source(env) == "KIMI_API_KEY"
    assert is_moonshot_configured(env) is True


def test_unconfigured():
    env = {}
    assert get_moonshot_api_key(env) == ""
    assert is_moonshot_configured(env) is False
    snap = moonshot_health_snapshot(env)
    assert snap["configured"] is False
    assert snap["features"]["trading"] is False


def test_health_no_secret_leak():
    env = {"MOONSHOT_API_KEY": "sk-super-secret-xyz", "MOONSHOT_MODEL": "kimi-k3"}
    snap = moonshot_health_snapshot(env)
    assert snap["configured"] is True
    assert "sk-super-secret" not in str(snap)
    assert snap["model"] == "kimi-k3"
    assert snap["sol_gpt_tools"]["shipped"] == 171


def test_defaults():
    assert resolve_moonshot_model({}) == "kimi-k3"
    assert SOL_GPT_TOOL_TOTALS["core"] == 122


def test_client_wrapper():
    c = KimiClient(env={})
    assert c.configured is False
    h = c.health()
    assert h["sol_gpt_tools"]["shipped"] == 171
