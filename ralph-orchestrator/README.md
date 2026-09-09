# Ralph Orchestrator for Solana Hedge Fund

Multi-agent orchestration system for the Solana Web3 Hedge Fund, adapted from the [Ralph Orchestrator](https://github.com/8bitsats/ralph-orchestrator) project.

## Overview

The Ralph Orchestrator implements the **Ralph Wiggum software engineering technique**: putting AI agents in a loop until task completion. This system coordinates 10 specialized agents to analyze markets, research trends, and execute trades on the Solana blockchain.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              SOLANA ORCHESTRATOR (Ralph Loop)                │
│  Task Decomposition → Agent Execution → Context Updates     │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   ANALYSTS   │  │  RESEARCHERS │  │  EXECUTORS   │
│              │  │              │  │              │
│ • TICKER-01  │  │ • ATLAS-BULL │  │ • EDGE-GROK  │
│ • ECHO-X     │  │ • ATLAS-BEAR │  │ • ATLAS-RISK │
│ • WIREHAWK   │  │ • FIRECRAWL  │  │ • EXECUTOR   │
│ • ATLAS-FUND │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Agent Roster

### Analysis Team (Google Gemini)
- **TICKER-01**: Market analyst - technical analysis and price patterns
- **ECHO-X**: Social analyst - sentiment tracking and narrative detection
- **WIREHAWK**: News analyst - information asymmetry detection
- **ATLAS-FUNDAMENTAL**: Fundamental analyst - probability estimation

### Research Team (OpenAI GPT-4 + Firecrawl)
- **ATLAS-BULL**: Bullish researcher - builds strongest bull case
- **ATLAS-BEAR**: Bearish researcher - identifies risks and bear case
- **FIRECRAWL**: Web researcher - deep web research and data gathering

### Execution Team (xAI Grok + Claude)
- **EDGE-GROK**: Trader - edge calculation and position sizing
- **ATLAS-RISK**: Risk manager - portfolio risk validation (veto power)
- **ATLAS-EXECUTOR**: Executor - human-in-the-loop trade execution

## Features

### Core Orchestration
- **Task Decomposition**: Breaks complex tasks into atomic agent subtasks
- **Sequential Execution**: Ralph Wiggum loop executes one task at a time
- **Context Management**: Agent scratchpad tracks progress across iterations
- **Memory Persistence**: JSON-based memory for completed tasks and state
- **Metrics Tracking**: Success rate, costs, iterations, and timing

### Firecrawl Integration
- **No-URL Research**: Just provide research prompt, agent handles navigation
- **Structured Output**: Pydantic schemas for typed research results
- **Async Job Management**: Non-blocking job polling with status tracking
- **Credit Tracking**: Monitors dynamic credit usage per request
- **Error Handling**: Retry logic with exponential backoff

### Safety & Recovery
- **Signal Handling**: Graceful shutdown on SIGINT/SIGTERM
- **Iteration Limits**: Max iterations (default: 100) and runtime (4 hours)
- **Task Retries**: Failed tasks retry up to 3 times before abandonment
- **Agent Scratchpad**: Persistent context prevents starting from scratch

## Installation

```bash
# Clone repository (if not already in SolanaAutomation)
cd SolanaAutomation/ralph-orchestrator

# Install dependencies
pip install aiohttp pydantic

# Set environment variables
export FIRECRAWL_API_KEY="your-firecrawl-api-key"
export OPENAI_API_KEY="your-openai-key"  # For GPT-4 agents
export ANTHROPIC_API_KEY="your-anthropic-key"  # For Claude agents
export XAI_API_KEY="your-xai-key"  # For Grok agent
```

## Usage

### Basic Orchestration

```python
from ralph_orchestrator.core import SolanaOrchestrator
import asyncio

async def main():
    orchestrator = SolanaOrchestrator(
        task_description="Analyze SOL/USDC and identify trading opportunities",
        max_iterations=50,
        verbose=True
    )

    result = await orchestrator.orchestrate()

    print(f"Status: {result['status']}")
    print(f"Success Rate: {result['metrics']['success_rate']:.1%}")
    print(f"Completed Tasks: {len(result['completed_tasks'])}")

asyncio.run(main())
```

### Firecrawl Agent (Standalone)

```python
from ralph_orchestrator.agents import FirecrawlAgent
import asyncio

async def research():
    async with FirecrawlAgent() as agent:
        # Quick search
        summary = await agent.quick_search("Solana DeFi TVL trends 2025")
        print(summary)

        # Deep research with structured output
        research = await agent.deep_research(
            topic="Jupiter DEX competitive analysis",
            specific_questions=[
                "What is Jupiter's market share?",
                "Who are main competitors?",
                "What are growth catalysts?"
            ]
        )

        print(f"Summary: {research.summary}")
        print(f"Key Findings: {research.key_findings}")
        print(f"Confidence: {research.confidence_level}")
        print(f"Credits Used: {agent.get_credits_used()}")

asyncio.run(research())
```

### Trading Pipeline

```python
async def execute_trade():
    orchestrator = SolanaOrchestrator(
        task_description="trade SOL/USDC based on current market conditions",
        max_iterations=100
    )

    # Orchestrator automatically decomposes into:
    # 1. TICKER-01: Technical analysis
    # 2. ECHO-X: Sentiment analysis
    # 3. WIREHAWK: News analysis
    # 4. ATLAS-FUNDAMENTAL: Probability estimates
    # 5. ATLAS-BULL: Bull case
    # 6. ATLAS-BEAR: Bear case
    # 7. EDGE-GROK: Edge calculation
    # 8. ATLAS-RISK: Risk validation
    # 9. ATLAS-EXECUTOR: Human approval + execution

    result = await orchestrator.orchestrate()

    # Check if trade was executed
    trades = result['context']['memory']['trade_history']
    print(f"Trades executed: {len(trades)}")

asyncio.run(execute_trade())
```

## Configuration

### Workspace Structure

The orchestrator creates a `.agent/` workspace:

```
.agent/
├── scratchpad.md       # Agent progress log
├── memory.json         # Persistent memory
├── checkpoints/        # Git checkpoints (optional)
├── metrics/            # Performance metrics
└── cache/              # Context cache
```

### Task Queue Priority

Tasks are executed by priority:
- **Priority 1**: Analysis agents (TICKER-01, ECHO-X, WIREHAWK, ATLAS-FUNDAMENTAL)
- **Priority 2**: Research agents (ATLAS-BULL, ATLAS-BEAR, FIRECRAWL)
- **Priority 3**: Trading calculation (EDGE-GROK)
- **Priority 4**: Risk validation (ATLAS-RISK)
- **Priority 5**: Execution (ATLAS-EXECUTOR)

## Firecrawl API Details

### Endpoint: `/agent`

The Firecrawl agent endpoint enables autonomous web research:

**Request:**
```json
{
  "prompt": "Research Solana DeFi ecosystem growth trends",
  "max_depth": 3,
  "schema": { /* Pydantic schema */ }
}
```

**Response:**
```json
{
  "id": "job-123abc",
  "status": "completed",
  "data": {
    "summary": "...",
    "key_findings": [...],
    "sources": [...]
  },
  "credits_used": 42
}
```

### Credit Pricing

Firecrawl uses dynamic credit-based billing:
- Credits are deducted based on pages crawled, depth, and processing
- Typical research task: 10-100 credits
- Check balance before large jobs
- Monitor `credits_used` in responses

## Error Handling

### Common Errors

1. **Insufficient Credits** (HTTP 402)
   - Error: "Insufficient Firecrawl credits"
   - Solution: Add credits to Firecrawl account

2. **Rate Limiting** (HTTP 429)
   - Automatic retry with exponential backoff
   - Max retries: 3

3. **Job Timeout**
   - Default timeout: 300 seconds
   - Increase via `config.timeout` if needed

4. **Task Failure**
   - Tasks retry up to 3 times
   - Check scratchpad for error details

## Metrics & Monitoring

The orchestrator tracks:
- **Iterations**: Total agent invocations
- **Success Rate**: Successful iterations / total
- **Costs**: Estimated API costs by agent
- **Credits**: Firecrawl credits consumed
- **Timing**: Elapsed time and task duration

Access via `result['metrics']` after orchestration.

## Comparison to Original Ralph

This is adapted from the original [Ralph Orchestrator](https://github.com/8bitsats/ralph-orchestrator) with these modifications:

**Additions:**
- Solana-specific agent roster (10 specialized agents)
- Firecrawl agent for web research
- Trading pipeline orchestration
- Memory persistence for market context
- Trade history tracking

**Preserved:**
- Ralph Wiggum technique (loop until completion)
- Task decomposition and prioritization
- Agent scratchpad for context
- Graceful signal handling
- Metrics and cost tracking

## Examples

See [examples/](examples/) directory for:
- `basic_orchestration.py` - Simple task orchestration
- `trading_pipeline.py` - Full trading workflow
- `firecrawl_research.py` - Standalone Firecrawl usage
- `custom_agents.py` - Adding custom agent types

## Contributing

This is part of the [Solana-Automation](https://github.com/8bitsats/SolanaAutomation) project.

## License

MIT License - See [LICENSE](../LICENSE)

## Credits

- Original Ralph Orchestrator: [8bitsats/ralph-orchestrator](https://github.com/8bitsats/ralph-orchestrator)
- Firecrawl API: [firecrawl.dev](https://firecrawl.dev)
- Built by **8bit** & **@0rdlibrary**
