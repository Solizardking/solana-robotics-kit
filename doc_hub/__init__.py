"""
Solana Automation Documentation Hub

Intelligent document understanding and conversational AI for documentation.
"""

from doc_hub.parser import DocumentParser
from doc_hub.retriever import DocumentRetriever
from doc_hub.chat import ChatWithDocs
from doc_hub.graph_rag import GraphRAG
from doc_hub.indexer import DocumentIndexer

__version__ = "1.0.0"

__all__ = [
    "DocumentParser",
    "DocumentRetriever",
    "ChatWithDocs",
    "GraphRAG",
    "DocumentIndexer",
]
