"""Solana DIY manufacturing path — unit tests (no hardware)."""

from packages.solana_diy import (
    BOM_DELTA,
    CLAWD_MINT,
    LED_MAP,
    PRINT_FILE_LIST,
    SOLANA_COLORS,
    color_css_vars,
    color_for_element,
    doctor,
    immediate_actions,
    manufacturing_path,
    software_stack,
)
from packages.solana_diy.bom import cost_rollups


def test_solana_hex_exact():
    assert SOLANA_COLORS["purple"] == "#9945FF"
    assert SOLANA_COLORS["green"] == "#14F195"


def test_clawd_mint():
    assert CLAWD_MINT.startswith("8cHz")
    assert CLAWD_MINT.endswith("pump")


def test_print_list_nonempty():
    assert len(PRINT_FILE_LIST) >= 8
    ids = {p["id"] for p in PRINT_FILE_LIST}
    assert "OCASV1_CHEST_PLAQUE" in ids
    assert "OCASV1_JETSON_SHROUD" in ids


def test_bom_has_jetson_and_kit():
    ids = {r["id"] for r in BOM_DELTA}
    assert "ASIMOV_DIY_KIT" in ids
    assert "JETSON_AGX_ORIN" in ids
    assert "POWDER_COAT_PURPLE" in ids
    roll = cost_rollups()
    assert roll["required_low_usd"] > 10_000


def test_led_map():
    assert LED_MAP["idle_system"]["color"] == "#9945FF"
    assert LED_MAP["agent_active"]["color"] == "#14F195"


def test_color_for_element():
    frames = color_for_element("structural_frames")
    assert frames["color"] == "#9945FF"
    shells = color_for_element("shells_covers")
    assert "#14F195" in shells["color"] or shells["color"] == "#14F195"


def test_css_vars():
    css = color_css_vars()
    assert "--solana-purple: #9945FF" in css
    assert "--solana-green: #14F195" in css


def test_path_and_stack():
    path = manufacturing_path()
    assert "prototype" in path["phases"]
    assert path["colors"]["purple"] == "#9945FF"
    stack = software_stack()
    layers = {s["layer"] for s in stack}
    assert "1_clawd" in layers
    assert "3_groot" in layers
    assert len(immediate_actions()) >= 5


def test_doctor():
    d = doctor()
    assert d["colors"]["purple"] == "#9945FF"
    assert "checks" in d
    assert d["clawd_mint"] == CLAWD_MINT
