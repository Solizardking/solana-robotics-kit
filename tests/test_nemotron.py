"""Nemotron package unit tests — never download weights."""

import os

import pytest

from packages.nemotron import (
    DEFAULT_MODEL_ID,
    doctor,
    load_model,
    resolve_model_id,
    vllm_serve_command,
    MODEL_VARIANTS,
)


def test_default_model_id():
    assert "Nemotron-3-Nano-Omni" in DEFAULT_MODEL_ID
    assert resolve_model_id({}) == DEFAULT_MODEL_ID


def test_precision_nvfp4():
    mid = resolve_model_id({"NEMOTRON_PRECISION": "nvfp4"})
    assert mid == MODEL_VARIANTS["nvfp4"]["id"]


def test_doctor_no_crash():
    r = doctor({})
    assert r.model_id
    assert r.allow_load is False
    assert "bf16" in r.variants


def test_load_gated():
    env = {**os.environ, "NEMOTRON_ALLOW_LOAD": "0"}
    with pytest.raises(RuntimeError, match="NEMOTRON_ALLOW_LOAD"):
        load_model(env=env)


def test_vllm_cmd():
    cmd = vllm_serve_command("nvfp4")
    assert cmd[0] == "vllm"
    assert "NVFP4" in " ".join(cmd) or "nvfp4" in " ".join(cmd).lower()
    assert "--trust-remote-code" in cmd
