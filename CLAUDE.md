# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Preact-based LLM chat interface component using htm (Hyperscript Tagged Markup) that uses OpenRouter's API. The application supports streaming responses, multiple models, markdown rendering with MathJax support, and can be deployed with zero build steps using CDN imports or with Vite for development.

## Common Commands

**Development Server (Vite):**
```bash
npm run dev          # Starts Vite dev server on port 8080 with hot reload
```

**Zero-Build Deployment:**
```bash
python -m http.server 8080    # Serve files directly from any static server
# Works on GitHub Pages, Netlify, any static hosting
```

## Architecture

### Core Structure
This is a **Preact component library** using htm template literals, designed as a reusable chat interface, not a standalone application. The main export is `LLMChatInterface.js` which can be embedded in other Preact applications or used standalone with CDN resources.

### Key Components

**Main Component (`LLMChatInterface.js`):**
- Root component that orchestrates all chat functionality
- Manages API key persistence in localStorage
- Handles display modes (markdown/text) and error states
- Uses composition pattern with custom hooks for functionality

**Custom Hooks Architecture:**
- **`useChatEngine.js`**: Core chat logic with streaming support, message management, and OpenRouter API integration
- **`useModelManager.js`**: Handles fetching available models from OpenRouter API or using custom model lists
- **`useMarkdownRenderer.js`**: Manages markdown rendering with MathJax support
- **`useToolManager.js`**: Manages parallel tool execution with error handling and validation
- **`useMCPManager.js`**: Manages MCP (Model Context Protocol) server connections and remote tools

**Component Structure:**
- **`Sidebar.js`**: Model selection, API key input, MCP configuration, display mode toggle
- **`MessagesContainer.js`**: Message display with auto-scrolling and streaming support
- **`MessageInput.js`**: Input area with send functionality
- **`Message.js`**: Individual message rendering with tool execution display
- **`ErrorDisplay.js`**: Error handling and display

**Utilities:**
- **`html.js`**: htm binding setup for template literals
- **`apiClient.js`**: OpenRouter API client with streaming and non-streaming support
- **`mcpClient.js`**: MCP protocol client for external tool servers
- **`mathProcessor.js`**: MathJax integration utilities
- **`constants.js`**: Application constants and configuration

### Key Features
- **Zero Build Deployment** - htm template literals work directly in browsers - no compilation needed
- **Development Server** - Vite dev server for hot reloading during development only
- **CDN Dependencies** - All external dependencies loaded from CDN (esm.sh)
- **Streaming Responses** - Real-time message streaming with throttled updates
- **Tool Calling** - Parallel tool execution with local and remote (MCP) tools
- **Math Rendering** - MathJax support for LaTeX expressions with $ and $$ delimiters
- **State Management** - Custom hooks pattern for modular state management
- **API Integration** - OpenRouter API with proper CORS headers and error handling
- **Component Reusability** - Designed as embeddable Preact component with props API

### Development Notes
- Uses ES6 modules throughout with CDN imports for zero-build deployment
- Preact with htm template literals and hooks
- No external state management library - uses Preact's built-in state
- CSS is handled by Tailwind CSS (CDN)
- Zero build deployment - files can be served directly from any static server
- Vite used only for development hot reloading
- htm templates work directly in browsers without compilation
- API key is persisted in localStorage with automatic state synchronization
- Tool execution logs displayed in browser console for debugging
- Default development server runs on port 8080
- All files use `.js` extension (not `.jsx`) for proper MIME type handling on static servers

### File Structure
```
src/
├── main.js                 # App entry point with tool examples
├── LLMChatInterface.js     # Main component
├── components/             # UI components
│   ├── Sidebar.js         # Model selection & settings
│   ├── MessagesContainer.js # Message display
│   ├── MessageInput.js    # Input area
│   ├── Message.js         # Individual message
│   └── ErrorDisplay.js    # Error handling
├── hooks/                  # Custom hooks
│   ├── useChatEngine.js   # Core chat logic
│   ├── useModelManager.js # Model fetching
│   ├── useMarkdownRenderer.js # Markdown/math rendering
│   ├── useMCPManager.js   # MCP protocol
│   ├── useStreamingEngine.js # Streaming responses
│   └── useToolManager.js  # Tool execution
└── utils/                  # Utilities
    ├── html.js           # htm setup
    ├── apiClient.js      # OpenRouter API
    ├── mcpClient.js      # MCP client
    ├── httpClient.js     # HTTP utilities
    ├── mathProcessor.js  # MathJax integration
    └── constants.js      # App constants
```

### API Integration Details
- **Base URL**: `https://openrouter.ai/api/v1/chat/completions`
- **Streaming**: Uses Server-Sent Events with custom throttling (every 6th chunk)
- **Headers**: Includes HTTP-Referer and X-Title for OpenRouter requirements
- **Error Handling**: Comprehensive error handling with fallback to non-streaming mode
- **Default Model**: `openai/gpt-4o-mini`
- **Dependencies**: All loaded from CDN (esm.sh) for zero-build deployment

### htm Template Syntax
Instead of JSX, the project uses htm template literals:

```javascript
// JSX (old)
return <div className="chat">Hello {name}</div>;

// htm (current)
return html`<div className="chat">Hello ${name}</div>`;

// Components in htm
return html`<${Component} prop=${value} />`;

// Conditional rendering
return html`${condition && html`<div>Content</div>`}`;

// Lists/mapping
return html`${items.map(item => html`<div key=${item.id}>${item.name}</div>`)}`;
```

### Deployment Options

**Development:**
- `npm run dev` - Vite development server with hot reloading

**Production/Static:**
- `python -m http.server 8080` - Python static server
- GitHub Pages - Direct file hosting
- Netlify/Vercel - Static site hosting
- Any web server - Apache, nginx, etc.

### Migration Notes
This project was migrated from React to Preact + htm:
- **Bundle Size**: Reduced from ~40KB to ~3KB (92% reduction)
- **Build Process**: Eliminated - works directly in browsers
- **Development Experience**: Maintained - same hooks and component patterns
- **Deployment**: Simplified - works on any static server
- **File Extensions**: Changed from `.jsx` to `.js` for proper MIME types
- **Dependencies**: Moved from local npm packages to CDN imports

### Important Technical Details

**CDN Imports:**
All dependencies use CDN URLs for browser compatibility:
```javascript
import { render } from 'https://esm.sh/preact@10.19.3';
import { useState } from 'https://esm.sh/preact@10.19.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
```

**MIME Type Handling:**
- Files use `.js` extension (not `.jsx`) 
- Static servers serve `.js` with correct `text/javascript` MIME type
- Browsers can import ES6 modules without build process

**htm Template Processing:**
- Templates parsed at runtime by htm library
- No compilation or build step required
- Works in all modern browsers with ES6 module support

This architecture enables true zero-build deployment while maintaining a modern development experience with components, hooks, and reactive state management.