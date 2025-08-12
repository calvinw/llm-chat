# LLM Chat Interface — Preact + htm (Summary)

A lightweight, zero-build LLM chat interface built with Preact and htm. It supports streaming responses, local and remote (MCP) tool calls, and Markdown + MathJax rendering. Vite is used only for local development; production runs directly in the browser via CDN imports.

## What It Is
- Lightweight Preact UI using htm (no JSX, no build required).
- Works as a reusable component or standalone page.
- Streaming completions, tool calling (parallel), MCP integration, math rendering.

## How It Runs
- Dev server: `npm install` then `npm run dev` (Vite on :8080).
- Static serve: `python -m http.server 8080` and open `index.html`.
- Optional MCP server (Python): `python mcp_server.py` (SSE) or `python mcp_server.py --transport http` (streamable HTTP).

## Entry Points
- `index.html`: Loads Tailwind, markdown-it, MathJax; boots `src/main.js`.
- `src/main.js`: Mounts `<LLMChatInterface />`, wires example local tool and callbacks.

## Core Component
- `src/LLMChatInterface.js`: Orchestrates the chat UI.
  - API key persistence (localStorage), display mode, sidebar, error state.
  - Merges local tools with MCP tools and handlers.
  - Uses hooks: `useChatEngine`, `useModelManager`, `useMarkdownRenderer`, `useMCPManager`.
  - Layout: `Sidebar` + `MessagesContainer` + `MessageInput` + `ErrorDisplay`.

## Components
- `Sidebar.js`: API key, model selector, display mode, MCP URL + transport.
- `MessagesContainer.js`: Streaming updates via refs, auto-scroll.
- `Message.js`: Renders user/assistant; shows tool execution details; MathJax typesetting.
- `MessageInput.js`: Textarea with enter-to-send and auto-resize.
- `ErrorDisplay.js`: Inline error banner.

## Hooks
- `useChatEngine.js`: Messages state, OpenRouter requests, streaming + tool_calls, non-streaming fallback.
- `useStreamingEngine.js`: Streaming state, DOM update callbacks, nested tool calls, fallback path.
- `useToolManager.js`: Parallel tool execution with robust arg parsing and error capture.
- `useModelManager.js`: Fetch/sort models from OpenRouter; fallback to a default on error.
- `useMarkdownRenderer.js`: Markdown or plain text rendering; MathJax-safe preprocessing.
- `useMCPManager.js`: Connects to MCP server, discovers tools, exposes tool handlers.

## Utilities
- `apiClient.js`: OpenRouter client for streaming and non-streaming chat completions; throttles streaming updates and accumulates `tool_calls`.
- `mcpClient.js`: MCP client with auto transport detection (streamable HTTP or SSE legacy), initialize → list tools → call tools, SSE correlation.
- `httpClient.js`: Shared GET/POST with CORS + SSE parsing.
- `mathProcessor.js`: Protect/restore LaTeX during markdown processing; plain-text rendering helpers.
- `constants.js`: Roles, modes, API base, tool options.
- `html.js`: htm binding for Preact’s `h`.

## MCP Sample Server (Python)
- `mcp_server.py`: FastAPI + FastMCP server exposing `multiply_numbers` and `divide_numbers` via SSE or streamable HTTP.
  - CORS enabled, `.well-known/oauth-authorization-server` endpoint, `/info` route.

## Data Flow
1. User input → `useChatEngine.sendMessage()` → `OpenRouterClient.streamCompletion()`.
2. Streaming chunks → `MessagesContainer` updates last assistant message via ref callbacks.
3. If `tool_calls` present → `useToolManager` runs local + MCP handlers in parallel → tool execution messages are added → conversation continues with tool results.
4. Rendering → `useMarkdownRenderer` produces safe HTML; MathJax typesets on update/complete.

## Notable Details
- CDN imports (esm.sh) keep the bundle small; all files use `.js` for correct MIME types.
- Streaming updates are throttled (every 6th chunk) for smooth UI.
- Potential minor issue: `useStreamingEngine.js` non-streaming fallback references `errorMessage` without defining it (safe to patch if encountered).

## Quick Start
- Dev: `npm install && npm run dev` → http://localhost:8080
- Static: `python -m http.server 8080` → open `index.html`
- MCP (SSE): `python mcp_server.py` (endpoint printed on start)
- MCP (HTTP): `python mcp_server.py --transport http`

