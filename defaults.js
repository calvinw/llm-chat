/**
 * Application Defaults and Configuration
 * Contains default settings for the chat application
 */

// =============================================================================
// DEFAULT CONFIGURATION VALUES
// =============================================================================

/**
 * Default system prompt for the AI assistant
 * Includes instructions for proper LaTeX math formatting
 */
const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant. Please use dollar signs ($...$) and double dollar signs ($$...$$) for MathJax, and backslash any regular dollar signs (\\$) that are not for math.";

/**
 * Default AI model to use from OpenRouter
 * Can be changed by user via the model dropdown
 */
const DEFAULT_MODEL = "openai/gpt-4o-mini";

// =============================================================================
// EXPORTS
// =============================================================================

export default DEFAULT_SYSTEM_PROMPT;
export { DEFAULT_MODEL };