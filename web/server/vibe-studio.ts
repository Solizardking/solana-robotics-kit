/**
 * Vibe Coding Studio - Multi-Model AI Code Generation Service
 * 
 * Supports:
 * - GPT-5.2 Codex (OpenAI) - Advanced reasoning with reasoning_details
 * - Claude Opus 4.5 (Anthropic) - Complex understanding
 * - Grok Code Fast (xAI) - Fast code generation
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Model configurations
export const VIBE_STUDIO_MODELS = {
  CODEX: process.env.OPENROUTER_CODEX_MODEL || 'openai/gpt-5.2-codex',
  OPUS: process.env.OPENROUTER_OPUS_MODEL || 'anthropic/claude-opus-4.5',
  GROK: process.env.OPENROUTER_GROK_MODEL || 'x-ai/grok-code-fast-1',
} as const;

export type VibeModelId = 'codex' | 'opus' | 'grok';
export type CodeMode = 'generate' | 'edit' | 'explain' | 'debug' | 'refactor' | 'test';
export type CodeLanguage = 'html' | 'css' | 'javascript' | 'typescript' | 'react' | 'python' | 'rust' | 'solidity';

export interface VibeModel {
  id: VibeModelId;
  name: string;
  model: string;
  provider: string;
  description: string;
  supportsReasoning: boolean;
  icon: string;
}

export interface CodeModeInfo {
  id: CodeMode;
  name: string;
  description: string;
  icon: string;
  requiresCode: boolean;
}

export interface CodeLanguageInfo {
  id: CodeLanguage;
  name: string;
  extension: string;
  previewable: boolean;
}

export const VIBE_MODELS: VibeModel[] = [
  {
    id: 'codex',
    name: 'GPT-5.2 Codex',
    model: VIBE_STUDIO_MODELS.CODEX,
    provider: 'OpenAI',
    description: 'Advanced reasoning with step-by-step thinking',
    supportsReasoning: true,
    icon: '🧠',
  },
  {
    id: 'opus',
    name: 'Claude Opus 4.5',
    model: VIBE_STUDIO_MODELS.OPUS,
    provider: 'Anthropic',
    description: 'Complex understanding and nuanced code',
    supportsReasoning: false,
    icon: '🎭',
  },
  {
    id: 'grok',
    name: 'Grok Code Fast',
    model: VIBE_STUDIO_MODELS.GROK,
    provider: 'xAI',
    description: 'Fast and efficient code generation',
    supportsReasoning: false,
    icon: '⚡',
  },
];

export const CODE_MODES: CodeModeInfo[] = [
  { id: 'generate', name: 'Generate', description: 'Create new code from description', icon: '✨', requiresCode: false },
  { id: 'edit', name: 'Edit', description: 'Modify existing code', icon: '✏️', requiresCode: true },
  { id: 'explain', name: 'Explain', description: 'Understand how code works', icon: '💬', requiresCode: true },
  { id: 'debug', name: 'Debug', description: 'Find and fix issues', icon: '🐛', requiresCode: true },
  { id: 'refactor', name: 'Refactor', description: 'Improve code structure', icon: '🔄', requiresCode: true },
  { id: 'test', name: 'Test', description: 'Generate unit tests', icon: '🧪', requiresCode: true },
];

export const CODE_LANGUAGES: CodeLanguageInfo[] = [
  { id: 'html', name: 'HTML', extension: '.html', previewable: true },
  { id: 'css', name: 'CSS', extension: '.css', previewable: true },
  { id: 'javascript', name: 'JavaScript', extension: '.js', previewable: true },
  { id: 'typescript', name: 'TypeScript', extension: '.ts', previewable: false },
  { id: 'react', name: 'React/TSX', extension: '.tsx', previewable: false },
  { id: 'python', name: 'Python', extension: '.py', previewable: false },
  { id: 'rust', name: 'Rust', extension: '.rs', previewable: false },
  { id: 'solidity', name: 'Solidity', extension: '.sol', previewable: false },
];

export interface VibeCodeRequest {
  prompt: string;
  code?: string;
  language: CodeLanguage;
  mode: CodeMode;
  modelId: VibeModelId;
  enableReasoning?: boolean;
  conversationHistory?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
    reasoning_details?: unknown;
  }>;
}

export interface VibeCodeResponse {
  code: string;
  explanation?: string;
  reasoning_details?: unknown;
  model: string;
  language: CodeLanguage;
  mode: CodeMode;
}

function getModelById(modelId: VibeModelId): VibeModel | undefined {
  return VIBE_MODELS.find(m => m.id === modelId);
}

function buildSystemPrompt(mode: CodeMode, language: CodeLanguage): string {
  const langInfo = CODE_LANGUAGES.find(l => l.id === language);
  const langName = langInfo?.name || language;

  const basePrompt = `You are an expert ${langName} developer and coding assistant. You help users with code generation, editing, debugging, and explanation.`;

  const modePrompts: Record<CodeMode, string> = {
    generate: `${basePrompt}

When generating code:
- Write clean, well-structured, production-ready code
- Include helpful comments for complex logic
- Follow best practices and conventions for ${langName}
- Provide a brief explanation of what the code does

Format your response as:
\`\`\`${language}
[your code here]
\`\`\`

[Brief explanation of the code]`,

    edit: `${basePrompt}

When editing code:
- Make the requested changes while preserving existing functionality
- Maintain consistent code style
- Explain what changes you made and why

Format your response as:
\`\`\`${language}
[edited code here]
\`\`\`

[Explanation of changes made]`,

    explain: `${basePrompt}

When explaining code:
- Break down the code into logical sections
- Explain what each part does in plain language
- Highlight any important patterns or techniques used
- Note any potential issues or improvements

Provide a clear, educational explanation.`,

    debug: `${basePrompt}

When debugging code:
- Identify the root cause of the issue
- Explain why the bug occurs
- Provide the corrected code
- Suggest ways to prevent similar bugs

Format your response as:
\`\`\`${language}
[corrected code here]
\`\`\`

[Explanation of the bug and fix]`,

    refactor: `${basePrompt}

When refactoring code:
- Improve code structure and readability
- Apply SOLID principles where appropriate
- Optimize performance if possible
- Maintain the same functionality

Format your response as:
\`\`\`${language}
[refactored code here]
\`\`\`

[Explanation of improvements made]`,

    test: `${basePrompt}

When generating tests:
- Create comprehensive unit tests
- Cover edge cases and error conditions
- Use appropriate testing framework conventions
- Include descriptive test names

Format your response as:
\`\`\`${language}
[test code here]
\`\`\`

[Brief explanation of test coverage]`,
  };

  return modePrompts[mode];
}

function buildUserPrompt(request: VibeCodeRequest): string {
  const { prompt, code, mode } = request;

  if (mode === 'generate') {
    return prompt;
  }

  if (code) {
    return `${prompt}

Here is the code:
\`\`\`
${code}
\`\`\``;
  }

  return prompt;
}

function extractCodeFromResponse(content: string): { code: string; explanation: string } {
  // Try to extract code from markdown code blocks
  const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    matches.push(match);
  }

  if (matches.length > 0) {
    const code = matches.map(m => m[1].trim()).join('\n\n');
    // Get explanation (text outside code blocks)
    const explanation = content
      .replace(codeBlockRegex, '')
      .trim()
      .replace(/\n{3,}/g, '\n\n');
    return { code, explanation };
  }

  // No code blocks found, return content as explanation
  return { code: '', explanation: content };
}

export async function vibeCode(request: VibeCodeRequest): Promise<VibeCodeResponse | null> {
  if (!OPENROUTER_API_KEY) {
    console.error('[VibeStudio] OPENROUTER_API_KEY not configured');
    return null;
  }

  const model = getModelById(request.modelId);
  if (!model) {
    console.error(`[VibeStudio] Unknown model: ${request.modelId}`);
    return null;
  }

  try {
    const systemPrompt = buildSystemPrompt(request.mode, request.language);
    const userPrompt = buildUserPrompt(request);

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history if provided
    if (request.conversationHistory) {
      for (const msg of request.conversationHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: userPrompt });

    const requestBody: Record<string, unknown> = {
      model: model.model,
      messages,
    };

    // Enable reasoning for Codex if requested
    if (request.modelId === 'codex' && request.enableReasoning) {
      requestBody.reasoning = { enabled: true };
    }

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://solanarobotics.org',
        'X-Title': 'Solana Robotics Vibe Studio',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[VibeStudio] API error:', error);
      return null;
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    
    if (!choice?.message?.content) {
      console.error('[VibeStudio] No content in response');
      return null;
    }

    const { code, explanation } = extractCodeFromResponse(choice.message.content);

    return {
      code,
      explanation,
      reasoning_details: choice.message.reasoning_details,
      model: model.name,
      language: request.language,
      mode: request.mode,
    };
  } catch (error) {
    console.error('[VibeStudio] Error:', error);
    return null;
  }
}

// Convenience functions
export async function quickGenerate(
  prompt: string,
  language: CodeLanguage = 'typescript',
  modelId: VibeModelId = 'codex'
): Promise<string | null> {
  const result = await vibeCode({
    prompt,
    language,
    mode: 'generate',
    modelId,
    enableReasoning: true,
  });
  return result?.code || null;
}

export async function explainCode(
  code: string,
  language: CodeLanguage = 'typescript',
  modelId: VibeModelId = 'opus'
): Promise<{ explanation: string; model: string } | null> {
  const result = await vibeCode({
    prompt: 'Please explain this code in detail.',
    code,
    language,
    mode: 'explain',
    modelId,
  });
  
  if (!result) return null;
  
  return {
    explanation: result.explanation || result.code,
    model: result.model,
  };
}

export async function debugCode(
  code: string,
  issue: string,
  language: CodeLanguage = 'typescript',
  modelId: VibeModelId = 'codex'
): Promise<VibeCodeResponse | null> {
  return vibeCode({
    prompt: `Debug this code. The issue is: ${issue}`,
    code,
    language,
    mode: 'debug',
    modelId,
    enableReasoning: true,
  });
}

// Generate HTML preview document
export function generatePreviewHtml(html: string, css?: string, js?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    ${css || ''}
  </style>
</head>
<body>
  ${html}
  ${js ? `<script>${js}</script>` : ''}
</body>
</html>`;
}

// Export helper functions
export function getVibeModels(): VibeModel[] {
  return VIBE_MODELS;
}

export function getCodeModes(): CodeModeInfo[] {
  return CODE_MODES;
}

export function getCodeLanguages(): CodeLanguageInfo[] {
  return CODE_LANGUAGES;
}

export function isVibeStudioConfigured(): boolean {
  return !!OPENROUTER_API_KEY;
}
