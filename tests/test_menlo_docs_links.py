"""Menlo docs link table + soft-404 detector."""

from packages.asimov.docs_links import (
    ASSEMBLY_DOCS,
    KIT_LOCAL_DOCS,
    WORKING_DOCS,
    full_docs_index_markdown,
    looks_like_menlo_soft_404,
    resolve_doc,
    working_docs_markdown,
)


def test_working_docs_nonempty():
    assert len(WORKING_DOCS) >= 8
    assert any("asimov/1" in d["url"] for d in WORKING_DOCS)


def test_assembly_docs():
    assert len(ASSEMBLY_DOCS) >= 5
    assert any("assembly-preparations" in d["url"] for d in ASSEMBLY_DOCS)


def test_kit_local_has_mirror():
    urls = {d["url"] for d in KIT_LOCAL_DOCS}
    assert "docs/MENLO_DOCS_MIRROR.md" in urls
    assert "docs/ASIMOV_ASSEMBLY_FLOW.md" in urls


def test_soft_404_title():
    html = """<!DOCTYPE html><html><head>
    <title>404: This page could not be found.</title>
    <link rel="canonical" href="https://docs.menlo.ai"/>
    </head><body>This page could not be found.</body></html>"""
    assert looks_like_menlo_soft_404(html) is True


def test_soft_404_not_on_real_title():
    html = """<!DOCTYPE html><html><head>
    <title>What Is Asimov 1?</title>
    </head><body><h1>What Is Asimov 1?</h1>
    <p>Asimov 1 is an open-source reference humanoid.</p>
    </body></html>"""
    assert looks_like_menlo_soft_404(html) is False


def test_markdown_includes_kit_local():
    md = working_docs_markdown()
    assert "MENLO_DOCS_MIRROR" in md
    assert "Kit-local" in md
    assert full_docs_index_markdown() == md


def test_resolve_doc():
    hit = resolve_doc("Robot SDK")
    assert hit is not None
    assert "python-sdk" in hit["url"]
