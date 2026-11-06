import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key');
vi.stubEnv('OPENROUTER_CODEX_MODEL', 'openai/gpt-5.2-codex');
vi.stubEnv('OPENROUTER_OPUS_MODEL', 'anthropic/claude-opus-4.5');
vi.stubEnv('OPENROUTER_GROK_MODEL', 'x-ai/grok-code-fast-1');

import {
  VIBE_STUDIO_MODELS,
  VIBE_MODELS,
  CODE_MODES,
  CODE_LANGUAGES,
  vibeCode,
  quickGenerate,
  explainCode,
  debugCode,
  generatePreviewHtml,
  getVibeModels,
  getCodeModes,
  getCodeLanguages,
  isVibeStudioConfigured,
} from './vibe-studio';

describe('Vibe Studio Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('VIBE_STUDIO_MODELS', () => {
    it('should have correct model configurations', () => {
      expect(VIBE_STUDIO_MODELS.CODEX).toBe('openai/gpt-5.2-codex');
      expect(VIBE_STUDIO_MODELS.OPUS).toBe('anthropic/claude-opus-4.5');
      expect(VIBE_STUDIO_MODELS.GROK).toBe('x-ai/grok-code-fast-1');
    });
  });

  describe('VIBE_MODELS', () => {
    it('should have three models available', () => {
      expect(VIBE_MODELS).toHaveLength(3);
    });

    it('should have codex model with reasoning support', () => {
      const codex = VIBE_MODELS.find(m => m.id === 'codex');
      expect(codex).toBeDefined();
      expect(codex?.supportsReasoning).toBe(true);
      expect(codex?.provider).toBe('OpenAI');
    });

    it('should have opus model', () => {
      const opus = VIBE_MODELS.find(m => m.id === 'opus');
      expect(opus).toBeDefined();
      expect(opus?.provider).toBe('Anthropic');
    });

    it('should have grok model', () => {
      const grok = VIBE_MODELS.find(m => m.id === 'grok');
      expect(grok).toBeDefined();
      expect(grok?.provider).toBe('xAI');
    });
  });

  describe('CODE_MODES', () => {
    it('should have all code modes', () => {
      const modeIds = CODE_MODES.map(m => m.id);
      expect(modeIds).toContain('generate');
      expect(modeIds).toContain('edit');
      expect(modeIds).toContain('explain');
      expect(modeIds).toContain('debug');
      expect(modeIds).toContain('refactor');
      expect(modeIds).toContain('test');
    });
  });

  describe('CODE_LANGUAGES', () => {
    it('should have all supported languages', () => {
      const langIds = CODE_LANGUAGES.map(l => l.id);
      expect(langIds).toContain('html');
      expect(langIds).toContain('css');
      expect(langIds).toContain('javascript');
      expect(langIds).toContain('typescript');
      expect(langIds).toContain('react');
      expect(langIds).toContain('python');
      expect(langIds).toContain('rust');
      expect(langIds).toContain('solidity');
    });
  });

  describe('vibeCode', () => {
    it('should generate code with codex model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '```typescript\nconst hello = "world";\n```\n\nThis code declares a constant.',
              reasoning_details: { steps: ['Step 1', 'Step 2'] },
            },
          }],
        }),
      });

      const result = await vibeCode({
        prompt: 'Create a hello world variable',
        language: 'typescript',
        mode: 'generate',
        modelId: 'codex',
        enableReasoning: true,
      });

      expect(result).not.toBeNull();
      expect(result?.code).toBe('const hello = "world";');
      expect(result?.model).toBe('GPT-5.2 Codex');
      expect(result?.reasoning_details).toBeDefined();
    });

    it('should edit code with opus model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '```javascript\nconst greeting = "Hello, World!";\nconsole.log(greeting);\n```\n\nAdded console.log to output the greeting.',
            },
          }],
        }),
      });

      const result = await vibeCode({
        prompt: 'Add a console.log statement',
        code: 'const greeting = "Hello, World!";',
        language: 'javascript',
        mode: 'edit',
        modelId: 'opus',
      });

      expect(result).not.toBeNull();
      expect(result?.code).toContain('console.log');
      expect(result?.model).toBe('Claude Opus 4.5');
    });

    it('should explain code with grok model', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'This code defines a function that calculates the factorial of a number recursively.',
            },
          }],
        }),
      });

      const result = await vibeCode({
        prompt: 'Explain this code',
        code: 'function factorial(n) { return n <= 1 ? 1 : n * factorial(n - 1); }',
        language: 'javascript',
        mode: 'explain',
        modelId: 'grok',
      });

      expect(result).not.toBeNull();
      expect(result?.model).toBe('Grok Code Fast');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Rate limit exceeded' }),
      });

      const result = await vibeCode({
        prompt: 'Test prompt',
        language: 'typescript',
        mode: 'generate',
        modelId: 'codex',
      });

      expect(result).toBeNull();
    });
  });

  describe('quickGenerate', () => {
    it('should generate code with default settings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '```typescript\nconst x = 1;\n```',
            },
          }],
        }),
      });

      const result = await quickGenerate('Create a variable');

      expect(result).toBe('const x = 1;');
    });
  });

  describe('explainCode', () => {
    it('should explain code and return explanation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: 'This code creates a simple HTTP server.',
            },
          }],
        }),
      });

      const result = await explainCode(
        'const server = http.createServer();',
        'javascript'
      );

      expect(result).not.toBeNull();
      expect(result?.explanation).toContain('HTTP server');
      expect(result?.model).toBe('Claude Opus 4.5');
    });
  });

  describe('debugCode', () => {
    it('should debug code and return fix', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: '```javascript\nconst arr = [1, 2, 3];\nfor (let i = 0; i < arr.length; i++) {\n  console.log(arr[i]);\n}\n```\n\nFixed the off-by-one error.',
              reasoning_details: { fix: 'Changed <= to <' },
            },
          }],
        }),
      });

      const result = await debugCode(
        'const arr = [1, 2, 3]; for (let i = 0; i <= arr.length; i++) { console.log(arr[i]); }',
        'Array index out of bounds error',
        'javascript'
      );

      expect(result).not.toBeNull();
      expect(result?.code).toContain('i < arr.length');
      expect(result?.reasoning_details).toBeDefined();
    });
  });

  describe('generatePreviewHtml', () => {
    it('should generate complete HTML document', () => {
      const html = generatePreviewHtml('<h1>Hello</h1>');

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<h1>Hello</h1>');
    });

    it('should include CSS when provided', () => {
      const html = generatePreviewHtml('<h1>Hello</h1>', 'h1 { color: red; }');

      expect(html).toContain('h1 { color: red; }');
    });

    it('should include JS when provided', () => {
      const html = generatePreviewHtml('<h1>Hello</h1>', '', 'console.log("test");');

      expect(html).toContain('<script>console.log("test");</script>');
    });
  });

  describe('getVibeModels', () => {
    it('should return all available models', () => {
      const models = getVibeModels();

      expect(models).toHaveLength(3);
      expect(models[0].id).toBe('codex');
      expect(models[1].id).toBe('opus');
      expect(models[2].id).toBe('grok');
    });
  });

  describe('getCodeModes', () => {
    it('should return all code modes', () => {
      const modes = getCodeModes();

      expect(modes).toHaveLength(6);
    });
  });

  describe('getCodeLanguages', () => {
    it('should return all supported languages', () => {
      const languages = getCodeLanguages();

      expect(languages).toHaveLength(8);
    });
  });

  describe('isVibeStudioConfigured', () => {
    it('should return true when API key is configured', () => {
      expect(isVibeStudioConfigured()).toBe(true);
    });
  });
});

describe('Vibe Studio Code Modes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle generate mode correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: '```html\n<button>Click me</button>\n```',
          },
        }],
      }),
    });

    const result = await vibeCode({
      prompt: 'Create a button',
      language: 'html',
      mode: 'generate',
      modelId: 'codex',
    });

    expect(result?.mode).toBe('generate');
    expect(result?.code).toContain('button');
  });

  it('should handle refactor mode correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: '```typescript\nconst add = (a: number, b: number): number => a + b;\n```\n\nConverted to arrow function.',
          },
        }],
      }),
    });

    const result = await vibeCode({
      prompt: 'Convert to arrow function',
      code: 'function add(a: number, b: number): number { return a + b; }',
      language: 'typescript',
      mode: 'refactor',
      modelId: 'opus',
    });

    expect(result?.mode).toBe('refactor');
    expect(result?.code).toContain('=>');
  });

  it('should handle test mode correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: '```typescript\ndescribe("add", () => {\n  it("should add two numbers", () => {\n    expect(add(1, 2)).toBe(3);\n  });\n});\n```',
          },
        }],
      }),
    });

    const result = await vibeCode({
      prompt: 'Generate unit tests',
      code: 'function add(a: number, b: number): number { return a + b; }',
      language: 'typescript',
      mode: 'test',
      modelId: 'codex',
    });

    expect(result?.mode).toBe('test');
    expect(result?.code).toContain('describe');
    expect(result?.code).toContain('expect');
  });
});
