import json
from pathlib import Path
import pytest
from packages.isaac_gr00t.checkpoint import validate_checkpoint

def make_checkpoint(path):
    for name, value in {"config.json": {"model_type": "Gr00tN1d7"}, "model.safetensors.index.json": {"weight_map": {"layer": "model.safetensors"}}, "processor_config.json": {}, "embodiment_id.json": {}, "statistics.json": {}}.items():
        (path / name).write_text(json.dumps(value))

def test_missing_weights_are_not_ready(tmp_path):
    make_checkpoint(tmp_path)
    with pytest.raises(ValueError, match="Missing weight shard"):
        validate_checkpoint(tmp_path)

def test_rejects_wrong_architecture(tmp_path):
    make_checkpoint(tmp_path)
    (tmp_path / "config.json").write_text('{"model_type":"chat"}')
    with pytest.raises(ValueError, match="Expected Gr00tN1d7"):
        validate_checkpoint(tmp_path)

def test_rejects_path_escape(tmp_path):
    make_checkpoint(tmp_path)
    (tmp_path / "model.safetensors.index.json").write_text('{"weight_map":{"x":"../escape.safetensors"}}')
    with pytest.raises(ValueError, match="Invalid checkpoint shard"):
        validate_checkpoint(tmp_path)
