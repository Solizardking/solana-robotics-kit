"""Asimov hub + assembly plan tests (no GPU / no downloads)."""

from asimov import (
    ASSEMBLY_STAGES,
    CLAWD_MINT,
    assembly_plan,
    doctor,
    inventory,
    paths,
)


def test_paths_exist_keys():
    p = paths()
    assert "robotics" in p
    assert "sim_xml" in p
    assert "assembly_doc" in p


def test_inventory_catalog():
    inv = inventory()
    assert inv["ok"] is True
    assert inv["catalog"]["part_count"] >= 1
    assert inv["catalog"]["mesh_count"] >= 1
    assert inv["sim_xml_present"] is True
    assert inv["clawd_mint"] == CLAWD_MINT


def test_assembly_stages_count():
    assert len(ASSEMBLY_STAGES) == 12
    assert ASSEMBLY_STAGES[0]["name"] == "prep"
    assert ASSEMBLY_STAGES[-1]["name"] == "commission"


def test_plan_10k_under_budget():
    plan = assembly_plan(10_000)
    assert plan["budget_usd"] == 10_000
    assert plan["allocated_total_usd"] <= 10_000 + 0.05
    assert len(plan["stages"]) == 12
    assert "legs" in plan["priority_note"].lower() or "leg" in plan["priority_note"].lower()


def test_doctor_shape():
    d = doctor()
    assert "asimov" in d
    assert "plan_10k" in d
    assert "nemotron" in d
    assert d["asimov"]["ok"] is True
