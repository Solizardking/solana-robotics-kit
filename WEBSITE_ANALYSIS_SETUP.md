# Website Analysis Setup

## Overview

This feature allows users to analyze websites using Firecrawl (for scraping), Claude (for analysis), and E2B (for code execution and visualization). Based on the [e2b-cookbook claude-visualize-website-topics example](https://github.com/e2b-dev/e2b-cookbook/tree/main/examples/claude-visualize-website-topics).

## Prerequisites

1. **E2B API Key**: Get from https://e2b.dev/docs
2. **Anthropic API Key**: Get from https://console.anthropic.com/
3. **Firecrawl API Key**: Get from https://firecrawl.dev/

## Installation

1. **Install dependencies** (if not already installed):
```bash
cd /Users/8bit/Downloads/SolanaAutomation
source venv/bin/activate
pip install firecrawl-py anthropic e2b
```

2. **Set environment variables**:
Add to your `.env` file:
```bash
E2B_API_KEY=your_e2b_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

## Usage

### From Chrome Extension

Send a WebSocket message with type `analyze_website`:

```json
{
  "type": "analyze_website",
  "url": "https://example.com",
  "analysis_type": "topics"
}
```

### Analysis Types

- **`topics`** (default): Extracts main topics and creates a visualization
- **`summary`**: Provides a comprehensive summary
- **`sentiment`**: Performs sentiment analysis
- **Custom**: Any other analysis type you specify

### Response Format

The desktop agent responds with:

```json
{
  "type": "analysis_result",
  "result": {
    "url": "https://example.com",
    "title": "Example Website",
    "analysis_type": "topics",
    "stdout": "Analysis output...",
    "stderr": "",
    "exit_code": 0,
    "visualization": "base64_encoded_image_data",
    "visualization_type": "image/png"
  }
}
```

## How It Works

1. **Chrome Extension** sends `analyze_website` message via WebSocket
2. **Desktop Agent** receives the message and:
   - Uses **Firecrawl** to scrape the website content
   - Uses **Claude** to generate analysis code
   - Executes the code in an **E2B sandbox**
   - Returns results including visualizations

## Example Use Cases

1. **Topic Analysis**: "Analyze topics from https://solana.com"
2. **Content Summary**: Analyze and summarize a blog post
3. **Competitor Analysis**: Analyze competitor websites
4. **Market Research**: Extract insights from news articles

## Status Updates

During analysis, you'll receive status updates:

```json
{
  "type": "analysis_status",
  "status": "scraping|analyzing|generating|executing",
  "message": "Current status message..."
}
```

## Error Handling

If any API key is missing or there's an error, you'll receive:

```json
{
  "type": "analysis_result",
  "error": "Error message here"
}
```

## Notes

- Website content is limited to 10,000 characters for Claude analysis
- Visualizations are saved as PNG files in the E2B sandbox
- The sandbox has a 10-minute timeout
- Firecrawl handles JavaScript-rendered content automatically
