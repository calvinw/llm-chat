# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a React-based LLM chat interface component that uses OpenRouter's API. The application supports streaming responses, multiple models, markdown rendering with MathJax support, and can be deployed with zero build steps using Babel standalone or built with Vite.

## Common Commands

**Development Server (Vite):**
```bash
npm run dev          # Starts Vite dev server on port 8080
npm run build        # Build for production
npm run preview      # Preview production build
```

**Alternative Development (Zero Build):**
```bash
python -m http.server 8080    # Serve static files directly
# Open index.html in browser - uses Babel standalone for JSX transformation
```

## Architecture

### Core Structure
This is a **React component library** designed as a reusable chat interface, not a standalone application. The main export is `LLMChatInterface.jsx` which can be embedded in other React applications or used standalone with CDN resources.

### Key Components

**Main Component (`LLMChatInterface.jsx`):**
- Root component that orchestrates all chat functionality
- Manages API key persistence in localStorage
- Handles display modes (markdown/text) and error states
- Uses composition pattern with custom hooks for functionality

**Custom Hooks Architecture:**
- **`useChatEngine.js`**: Core chat logic with streaming support, message management, and OpenRouter API integration
- **`useModelManager.js`**: Handles fetching available models from OpenRouter API or using custom model lists
- **`useMarkdownRenderer.js`**: Manages markdown rendering with MathJax support
- **`useToolManager.js`**: Manages parallel tool execution with error handling and validation

**Component Structure:**
- **`ChatHeader.jsx`**: Header controls (model selector, clear button, display mode toggle)
- **`MessagesContainer.jsx`**: Message display with auto-scrolling
- **`MessageInput.jsx`**: Input area with send functionality
- **`ErrorDisplay.jsx`**: Error handling and display

**Utilities:**
- **`apiClient.js`**: OpenRouter API client with streaming and non-streaming support
- **`mathProcessor.js`**: MathJax integration utilities
- **`constants.js`**: Application constants and configuration

### Key Features
- **Dual Deployment**: Zero build (Babel standalone) OR Vite build process
- **Streaming Responses**: Real-time message streaming with throttled updates
- **Tool Calling**: Parallel tool execution with greet and timezone example tools
- **Math Rendering**: MathJax support for LaTeX expressions with $ and $$ delimiters
- **State Management**: Custom hooks pattern for modular state management
- **API Integration**: OpenRouter API with proper CORS headers and error handling
- **Component Reusability**: Designed as embeddable React component with props API

### Development Notes
- Uses ES6 modules throughout
- React 18 with functional components and hooks
- No external state management library - uses React's built-in state
- CSS is scoped with `llm-chat-` prefixes to avoid conflicts
- Supports both CDN-based (no build) and Vite-based development workflows
- API key is persisted in localStorage with automatic state synchronization
- Tool execution logs displayed in browser console for debugging
- Default development server runs on port 8080 (different from parent project's 5500)

### API Integration Details
- **Base URL**: `https://openrouter.ai/api/v1/chat/completions`
- **Streaming**: Uses Server-Sent Events with custom throttling (every 6th chunk)
- **Headers**: Includes HTTP-Referer and X-Title for OpenRouter requirements
- **Error Handling**: Comprehensive error handling with fallback to non-streaming mode
- **Default Model**: `openai/gpt-4o-mini`