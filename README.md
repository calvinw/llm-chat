# LLM Chat Interface - Preact + htm

A lightweight, zero-build LLM chat interface built with **Preact** and **htm** (Hyperscript Tagged Markup). Features streaming responses, tool calling, MCP integration, and math rendering. Deploys anywhere - GitHub Pages, Python server, or any static hosting.

## 🚀 Key Features

- **🔧 Zero Build Required** - htm template literals work directly in browsers
- **📦 Lightweight** - Preact (~3KB) instead of React (~40KB) 
- **🏗️ No Compilation** - htm templates parsed at runtime, no JSX transformation
- **📡 Streaming Responses** - Real-time message streaming with throttled updates
- **🛠️ Tool Calling** - Parallel tool execution with local and remote tools
- **📊 MCP Integration** - Model Context Protocol support for external tool servers
- **🧮 Math Rendering** - MathJax support for LaTeX expressions ($x^2$ and $$equations$$)
- **📱 Responsive Design** - Works on desktop and mobile
- **🔥 Hot Reloading** - Vite development server for smooth development
- **🌐 Deploy Anywhere** - Python server, GitHub Pages, any static hosting

## 🏗️ Architecture

### Dual Development Modes

**Development Mode:**
```bash
npm run dev  # Vite dev server with hot reloading on port 8080
```

**Production/Static Deployment:**
```bash
python -m http.server 8080  # Or any static file server
```

### Component Architecture

This is a **Preact component library** using htm template literals:

```
src/
├── main.js                 # App entry point with tool examples
├── LLMChatInterface.js     # Main chat component
├── components/             # UI components (htm templates)
│   ├── Sidebar.js         # Model selection, API key, MCP settings
│   ├── MessagesContainer.js # Message display with streaming
│   ├── MessageInput.js    # Input area with send functionality
│   ├── Message.js         # Individual message rendering
│   └── ErrorDisplay.js    # Error handling display
├── hooks/                  # Custom hooks (Preact compatible)
│   ├── useChatEngine.js   # Core chat logic with streaming
│   ├── useModelManager.js # Model fetching from OpenRouter
│   ├── useMarkdownRenderer.js # Markdown + MathJax rendering
│   ├── useMCPManager.js   # MCP server connections
│   └── useToolManager.js  # Tool execution management
└── utils/                  # Utilities
    ├── html.js            # htm binding setup
    ├── apiClient.js       # OpenRouter API client
    ├── mcpClient.js       # MCP protocol client
    └── mathProcessor.js   # MathJax integration
```

## 🛠️ Development

### Prerequisites

```bash
npm install  # Only needed for development server
```

### Development Workflow

```bash
# Development with hot reloading
npm run dev
# Opens http://localhost:8080

# No build step needed for deployment!
# Just copy files to any web server
```

### Production Deployment

**Option 1: Python Server**
```bash
python -m http.server 8080
# Works immediately - no build needed
```

**Option 2: GitHub Pages**
```bash
# Just push to GitHub Pages
# CDN imports work directly in browsers
```

**Option 3: Any Static Host**
```bash
# Upload files to: Netlify, Vercel, Apache, nginx, etc.
# All dependencies loaded from CDN
```

## 📦 Usage

### Standalone Usage

Open `index.html` in any browser or serve with any static server. The interface includes:

- API key management (stored in localStorage)
- Model selection (OpenRouter models)
- Tool calling examples
- MCP server integration UI
- Math rendering support

### Component Integration

```javascript
import { html } from './src/utils/html.js';
import LLMChatInterface from './src/LLMChatInterface.js';

const App = () => html`
  <${LLMChatInterface}
    defaultModel="openai/gpt-4o-mini"
    height="100vh"
    tools=${tools}
    toolHandlers=${toolHandlers}
    enableTools=${true}
    sidebarPosition="left"  // Optional: "left" or "right" (default)
  />
`;
```

### Sidebar Position

The sidebar can be positioned on either the left or right side of the chat interface:
- `sidebarPosition="left"` - Sidebar appears on the left side
- `sidebarPosition="right"` - Sidebar appears on the right side (default)
```

### Tool Calling Example

```javascript
const tools = [
  {
    type: "function",
    function: {
      name: "add_numbers",
      description: "Add two numbers together",
      parameters: {
        type: "object",
        properties: {
          a: { type: "number", description: "First number" },
          b: { type: "number", description: "Second number" }
        },
        required: ["a", "b"]
      }
    }
  }
];

const toolHandlers = {
  add_numbers: ({ a, b }) => ({ result: a + b })
};
```

## 🌐 API Configuration

### OpenRouter Integration

```javascript
// Automatic model fetching from OpenRouter API
// Supports: GPT-4, Claude, Gemini, Llama, etc.
// Streaming: Server-Sent Events with throttling
// Headers: Proper CORS and referrer headers
```

### MCP Server Integration

```javascript
// Connect to external tool servers
// Supports: HTTP and SSE transports
// Auto-detection of server capabilities
// Tool discovery and execution
```

## 🎯 Technical Details

### htm Template Syntax

Instead of JSX:
```javascript
// Old JSX
return <div className="chat">Hello {name}</div>;

// New htm
return html`<div className="chat">Hello ${name}</div>`;
```

### CDN Dependencies

All imports use CDN URLs for zero-build deployment:
```javascript
import { render } from 'https://esm.sh/preact@10.19.3';
import { useState } from 'https://esm.sh/preact@10.19.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
```

### File Extensions

- All files use `.js` extension (not `.jsx`) for proper MIME types
- Static servers serve `.js` files correctly for ES6 modules
- Browser loads modules without compilation

## 📁 Project Structure

```
llm-chat/
├── index.html              # Entry point (works on any server)
├── src/                    # Source files (ES6 modules)
│   ├── main.js            # Application entry
│   ├── LLMChatInterface.js # Main component
│   ├── components/        # UI components
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utilities
├── package.json           # Development dependencies only
├── vite.config.js         # Development server config
└── README.md              # This file
```

## 🔄 Migration from React

This project was successfully migrated from React to Preact + htm:

**Benefits Achieved:**
- **92% smaller bundle** (3KB vs 40KB)
- **Zero build requirement** - works directly in browsers
- **Same developer experience** - hooks, components, state management
- **Universal deployment** - works on any static server
- **Faster development** - no compilation step needed

**Migration Process:**
1. React → Preact (API compatible)
2. JSX → htm template literals
3. Local imports → CDN imports  
4. `.jsx` → `.js` file extensions

## 🎨 Styling

- **Tailwind CSS** - Utility-first CSS framework (CDN)
- **MathJax** - Mathematical expression rendering
- **Responsive Design** - Mobile-first approach
- **Dark Mode Ready** - Theme switching support

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Test with `npm run dev`
4. Test deployment with `python -m http.server 8080`
5. Submit pull request

**Development Notes:**
- No build step needed for most changes
- Edit files directly and refresh browser
- Vite dev server provides hot reloading
- All dependencies loaded from CDN in production