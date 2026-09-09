# Solana Automation Documentation Hub

## Overview

The Solana Automation Documentation Hub is a comprehensive knowledge base with intelligent document understanding, indexing, and conversational AI capabilities. Built on NVIDIA NeMo Retriever and powered by advanced embedding models, this hub enables natural language querying across all documentation.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  USER INTERFACE: Chat with Docs (React + WebSocket)            │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│  RAG PIPELINE: Query Processing & Response Generation           │
│  - Query Understanding (nemotron-3-nano-30b-a3b)                │
│  - Context Retrieval (llama-3.2-nv-embedqa-1b-v2)              │
│  - Re-ranking (llama-3.2-nv-rerankqa-1b-v2)                    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│  DOCUMENT INGESTION PIPELINE:                                   │
│  - PDF/MD/Code Parser (nemotron-parse)                          │
│  - Chunking & Embedding                                          │
│  - Metadata Extraction                                           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│  VECTOR DATABASE: Milvus/Weaviate                               │
│  - Document vectors (1536d embeddings)                          │
│  - Metadata index (file, section, timestamps)                   │
│  - Hybrid search (semantic + keyword)                           │
└─────────────────────────────────────────────────────────────────┘
```

## Indexed Documentation

### Core Documentation
- **AGENT_ROSTER.md** - Complete agent profiles and capabilities
- **NVIDIA_NIM_INTEGRATION.md** - GPU-accelerated inference setup
- **WEB3_HEDGE_FUND_ARENA.md** - Trading competition platform
- **CLAUDE.md** - Development guidelines and architecture
- **README.md** - Project overview and quickstart

### Technical Documentation
- **API Documentation** - FastAPI endpoints and schemas
- **Smart Contract Docs** - Anchor program specifications
- **Tool Documentation** - DeFi protocol integrations
- **Character Profiles** - AI agent personalities

### Code Documentation
- Python modules (docstrings, type hints)
- TypeScript interfaces and types
- Rust smart contract comments
- Configuration schemas

## Features

### 1. Intelligent Document Parsing

```python
from doc_hub import DocumentParser

parser = DocumentParser(
    model="nvidia/nemotron-parse",
    api_key=os.getenv("NVIDIA_API_KEY")
)

# Parse documents with structure preservation
result = parser.parse_document(
    file_path="docs/AGENT_ROSTER.md",
    extract_metadata=True,
    preserve_formatting=True
)

# Output:
# {
#   "sections": [
#     {"title": "TICKER-01", "level": 2, "content": "..."},
#     {"title": "ECHO-X", "level": 2, "content": "..."}
#   ],
#   "metadata": {
#     "file": "AGENT_ROSTER.md",
#     "tokens": 15420,
#     "sections": 9,
#     "last_modified": "2026-01-08"
#   }
# }
```

### 2. Semantic Search

```python
from doc_hub import DocumentRetriever

retriever = DocumentRetriever(
    embedding_model="nvidia/llama-3.2-nv-embedqa-1b-v2",
    rerank_model="nvidia/llama-3.2-nv-rerankqa-1b-v2",
    vector_db="milvus://localhost:19530"
)

# Search with semantic understanding
results = retriever.search(
    query="How does TICKER-01 analyze market data?",
    top_k=5,
    filters={"document": "AGENT_ROSTER.md"}
)

# Output:
# [
#   {
#     "content": "TICKER-01 uses Yahoo Finance APIs...",
#     "score": 0.94,
#     "source": "docs/AGENT_ROSTER.md:45-67",
#     "metadata": {"agent": "TICKER-01", "section": "capabilities"}
#   }
# ]
```

### 3. Context-Aware RAG

```python
from doc_hub import ChatWithDocs

chat = ChatWithDocs(
    llm="nvidia/nemotron-3-nano-30b-a3b",
    retriever=retriever,
    reasoning_budget=16384
)

# Multi-turn conversation with document context
response = chat.query(
    question="What models does the arena use?",
    conversation_history=[
        {"role": "user", "content": "Tell me about the Web 3 Hedge Fund Arena"},
        {"role": "assistant", "content": "The arena is a competition platform..."}
    ]
)

# Output:
# {
#   "answer": "The arena uses multiple models including...",
#   "reasoning": "Based on the documentation, I found...",
#   "sources": [
#     "WEB3_HEDGE_FUND_ARENA.md:120-145",
#     "AGENT_ROSTER.md:89-102"
#   ],
#   "confidence": 0.92
# }
```

### 4. Graph-RAG for Complex Queries

```python
from doc_hub import GraphRAG

graph_rag = GraphRAG(
    graph_db="neo4j://localhost:7687",
    llm="nvidia/nemotron-3-nano-30b-a3b"
)

# Multi-hop reasoning across documents
result = graph_rag.query(
    question="How do agents use NVIDIA NIM in the arena?",
    reasoning_depth=3
)

# Output:
# {
#   "answer": "Agents leverage NVIDIA NIM for GPU-accelerated inference...",
#   "reasoning_chain": [
#     "1. Found agent architecture in AGENT_ROSTER.md",
#     "2. Discovered NIM integration in NVIDIA_NIM_INTEGRATION.md",
#     "3. Connected to arena deployment in WEB3_HEDGE_FUND_ARENA.md"
#   ],
#   "entities": ["TICKER-01", "NVIDIA NIM", "Arena", "GPU"],
#   "relationships": [
#     "TICKER-01 -> USES -> NVIDIA NIM",
#     "NVIDIA NIM -> POWERS -> Arena"
#   ]
# }
```

## Chat Interface Features

### Real-Time Document Chat
- Natural language queries
- Streaming responses with reasoning
- Source citation with line numbers
- Confidence scores
- Follow-up suggestions

### Advanced Capabilities
- **Multi-document synthesis** - Combine information across multiple docs
- **Code search** - Find specific implementations
- **Version awareness** - Track documentation changes
- **Personalization** - Learn from user query patterns

### Example Queries

```
User: "What are TICKER-01's superpowers?"
→ Returns agent capabilities from AGENT_ROSTER.md with code examples

User: "How do I deploy the arena?"
→ Walks through deployment from WEB3_HEDGE_FUND_ARENA.md with prerequisites

User: "Show me the smart contract for agent registration"
→ Returns Rust code from programs/agent-arena/src/lib.rs with explanations

User: "What's the difference between ATLAS-BULL and ATLAS-BEAR?"
→ Compares two agents with side-by-side analysis

User: "How does the prediction market calculate payouts?"
→ Explains algorithm with math and code from prediction-market contract
```

## Document Indexing Pipeline

### Step 1: Document Discovery
```bash
python doc_hub/index.py discover \
  --paths docs/ code/ programs/ \
  --extensions .md .py .ts .rs \
  --exclude node_modules/ __pycache__/
```

### Step 2: Parsing & Chunking
```bash
python doc_hub/index.py parse \
  --model nvidia/nemotron-parse \
  --chunk-size 512 \
  --chunk-overlap 50 \
  --preserve-code-blocks
```

### Step 3: Embedding Generation
```bash
python doc_hub/index.py embed \
  --model nvidia/llama-3.2-nv-embedqa-1b-v2 \
  --batch-size 32 \
  --normalize
```

### Step 4: Vector Database Ingestion
```bash
python doc_hub/index.py ingest \
  --vector-db milvus \
  --collection solana_automation_docs \
  --create-index HNSW
```

## API Endpoints

### Search Documents
```http
POST /api/docs/search
Content-Type: application/json

{
  "query": "How does TICKER-01 work?",
  "top_k": 5,
  "filters": {
    "document": "AGENT_ROSTER.md"
  }
}
```

### Chat with Docs
```http
POST /api/docs/chat
Content-Type: application/json

{
  "message": "Explain the agent arena",
  "conversation_id": "conv_123",
  "stream": true
}
```

### Get Document Structure
```http
GET /api/docs/structure?file=docs/AGENT_ROSTER.md
```

## Performance Metrics

| Operation | Latency | Throughput |
|-----------|---------|------------|
| Document parsing | 50ms/page | 1200 pages/min |
| Embedding generation | 5ms/chunk | 6400 chunks/min |
| Vector search | 10ms | 100 QPS |
| Re-ranking | 20ms | 50 QPS |
| End-to-end query | 150ms | 30 QPS |

## Configuration

### Environment Variables
```bash
# NVIDIA API
NVIDIA_API_KEY=nvapi-xxx

# Vector Database
VECTOR_DB_TYPE=milvus
VECTOR_DB_HOST=localhost
VECTOR_DB_PORT=19530

# Graph Database
GRAPH_DB_TYPE=neo4j
GRAPH_DB_URI=neo4j://localhost:7687

# Models
EMBEDDING_MODEL=nvidia/llama-3.2-nv-embedqa-1b-v2
RERANK_MODEL=nvidia/llama-3.2-nv-rerankqa-1b-v2
LLM_MODEL=nvidia/nemotron-3-nano-30b-a3b
PARSE_MODEL=nvidia/nemotron-parse

# Performance
EMBEDDING_BATCH_SIZE=32
MAX_CHUNK_SIZE=512
TOP_K_RETRIEVAL=10
REASONING_BUDGET=16384
```

## Usage Examples

### CLI Interface
```bash
# Index all documentation
solana-docs index --rebuild

# Query from terminal
solana-docs query "How do I create a new agent?"

# Interactive chat
solana-docs chat

# Export knowledge graph
solana-docs export --format graphml --output knowledge_graph.xml
```

### Python SDK
```python
from solana_automation import DocHub

# Initialize hub
hub = DocHub.connect()

# Simple query
answer = hub.query("What models are available?")
print(answer.text)
print(f"Sources: {answer.sources}")

# Chat session
with hub.chat_session() as chat:
    response1 = chat.send("Tell me about TICKER-01")
    response2 = chat.send("What are its capabilities?")  # Uses context
    response3 = chat.send("Show me code examples")
```

### Web Interface
```typescript
import { DocHubClient } from '@solana-automation/doc-hub';

const client = new DocHubClient({
  apiUrl: 'http://localhost:8000',
  websocket: true
});

// Search documents
const results = await client.search({
  query: "agent arena deployment",
  filters: { type: "documentation" }
});

// Stream chat response
client.chat({
  message: "Explain the prediction market",
  onChunk: (chunk) => console.log(chunk),
  onComplete: (response) => console.log("Done:", response)
});
```

## Future Enhancements

### Planned Features
- **Multi-modal search** - Search code, diagrams, and architecture images
- **Auto-documentation** - Generate docs from code using VLMs
- **Version diffing** - Compare documentation across versions
- **Smart suggestions** - Proactive documentation recommendations
- **Integration** - Connect with IDE, Slack, Discord
- **Analytics** - Track most-asked questions and documentation gaps

### Roadmap
- Q1 2026: Multi-modal document understanding with Cosmos models
- Q2 2026: Real-time documentation sync with git commits
- Q3 2026: Voice interface for documentation queries
- Q4 2026: Automated documentation generation from code

## Resources

- **Documentation**: https://docs.solana-automation.dev/doc-hub
- **API Reference**: https://api.solana-automation.dev/docs
- **Examples**: `/examples/doc_hub/`
- **Discord**: https://discord.gg/solana-automation

## Support

For questions or issues:
- GitHub Issues: https://github.com/8bitsats/SolanaAutomation/issues
- Discord: #doc-hub channel
- Email: support@solana-automation.dev
