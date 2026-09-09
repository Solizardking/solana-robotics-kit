# Image Generation Guide

## Overview

The PUMP-MCP server now includes OpenAI GPT Image 1.5 integration for generating token images automatically!

## Features

- **Automatic Image Generation**: Generate images when creating tokens using text prompts
- **Standalone Image Generation**: Generate images independently for any purpose
- **High Quality**: Uses GPT Image 1.5 model for best results
- **Flexible Options**: Customize size, quality, format, and background

## Usage

### 1. Generate Image When Creating Token

When creating a token, you can now provide a `generateImagePrompt` instead of (or in addition to) an `imageUrl`:

**Via MCP in Cursor/Claude:**
```
Create a token called "MyToken" with symbol "MTK" and description "My awesome token" 
with an initial buy of 0.01 SOL and generate an image with prompt "A futuristic neon 
token logo with geometric shapes and vibrant colors"
```

**Via Command Line:**
```bash
node build/create-token.js "MyToken" "MTK" "My awesome token" 0.01 default "" "A futuristic neon token logo"
```

### 2. Standalone Image Generation

Generate images independently using the MCP tool:

**Via MCP:**
```
Generate an image with prompt "A cyberpunk token logo with neon blue and purple colors, 
futuristic design, high tech aesthetic"
```

**Via Command Line:**
```bash
node build/generate-image.js "A cyberpunk token logo with neon colors" --model gpt-image-1.5 --quality high
```

### 3. Advanced Options

**Full CLI Options:**
```bash
node build/generate-image.js "<prompt>" \
  --model gpt-image-1.5 \
  --size 1024x1024 \
  --quality high \
  --format png \
  --background auto \
  --output images/my-token.png
```

**Available Models:**
- `gpt-image-1.5` (recommended, best quality)
- `gpt-image-1` (good quality)
- `gpt-image-1-mini` (cost-effective)

**Available Sizes:**
- `1024x1024` (square)
- `1024x1536` (portrait)
- `1536x1024` (landscape)
- `auto` (model decides)

**Quality Options:**
- `low` (fastest, 272 tokens for square)
- `medium` (balanced, 1056 tokens)
- `high` (best quality, 4160 tokens)
- `auto` (model decides)

**Formats:**
- `png` (default, supports transparency)
- `jpeg` (faster, smaller)
- `webp` (modern, efficient)

**Background:**
- `transparent` (PNG/WebP only)
- `opaque` (solid background)
- `auto` (model decides)

## Configuration

Make sure your `.env` file includes:
```
OPENAI_API_KEY=sk-proj-...
```

## Examples

### Example 1: Simple Token with Generated Image
```
Create token "MoonToken" with symbol "MOON" and description "To the moon!" 
with initial buy 0.01 SOL, generate image: "A cute cartoon moon with a rocket, 
space theme, vibrant colors"
```

### Example 2: High Quality Logo
```
Generate image: "Professional cryptocurrency token logo, minimalist design, 
gold and black colors, modern typography" --quality high --size 1024x1024
```

### Example 3: Transparent Background
```
Generate image: "2D pixel art style token icon, retro gaming aesthetic" 
--background transparent --format png
```

## Cost Considerations

Image generation costs depend on:
- **Size**: Larger images = more tokens
- **Quality**: Higher quality = more tokens
- **Model**: gpt-image-1.5 is most expensive but best quality

See OpenAI pricing for current rates.

## Troubleshooting

1. **"OPENAI_API_KEY not set"**: Add your API key to `.env` file
2. **Image generation fails**: Check your API key is valid and has credits
3. **Slow generation**: Use `quality: low` or `gpt-image-1-mini` for faster results
4. **Disk space**: Generated images are saved to `images/` directory

## Files Generated

- Images are saved to: `images/generated-<timestamp>.png`
- Token-specific images: `images/token-<token-name>.png`
- Custom paths: Use `--output` option

Enjoy generating amazing token images! 🎨
