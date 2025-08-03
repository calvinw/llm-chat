/**
 * Application constants and configuration
 */

export const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant. Please use dollar signs ($...$) and double dollar signs ($$...$$) for MathJax, and backslash any regular dollar signs (\\$) that are not for math.";

export const DEFAULT_MODEL = "openai/gpt-4o-mini";

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
  TOOL: 'tool'
};

export const DISPLAY_MODES = {
  MARKDOWN: 'markdown',
  TEXT: 'text'
};

export const API_CONFIG = {
  BASE_URL: 'https://openrouter.ai/api/v1'
};

export const TOOL_CHOICE_OPTIONS = {
  NONE: 'none',
  AUTO: 'auto',
  REQUIRED: 'required'
};

export const TOOL_CALL_STATUS = {
  PENDING: 'pending',
  EXECUTING: 'executing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export default {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_MODEL,
  MESSAGE_ROLES,
  DISPLAY_MODES,
  API_CONFIG,
  TOOL_CHOICE_OPTIONS,
  TOOL_CALL_STATUS
};