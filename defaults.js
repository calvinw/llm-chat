// Simple defaults for chat application
const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI assistant. Please use dollar signs ($...$) and double dollar signs ($$...$$) for MathJax, and backslash any regular dollar signs (\\$) that are not for math.";
const DEFAULT_MODEL = "openai/gpt-4o-mini";

export default DEFAULT_SYSTEM_PROMPT;
export { DEFAULT_MODEL };