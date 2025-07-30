/**
 * Application constants and configuration
 */

export const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant. Please use dollar signs ($...$) and double dollar signs ($$...$$) for MathJax, and backslash any regular dollar signs (\\$) that are not for math.";

export const DEFAULT_MODEL = "openai/gpt-4o-mini";

export const MESSAGE_ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
};

export const DISPLAY_MODES = {
  MARKDOWN: 'markdown',
  TEXT: 'text'
};

export const API_CONFIG = {
  BASE_URL: 'https://openrouter.ai/api/v1'
};

export default {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_MODEL,
  MESSAGE_ROLES,
  DISPLAY_MODES,
  API_CONFIG
};