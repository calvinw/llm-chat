# React LLM Chat Interface

A React-based chat interface component for Large Language Models using OpenRouter's API. Features streaming responses, tool calling support, MCP (Model Context Protocol) integration with dual transport support, markdown rendering with MathJax, and can be deployed with zero build steps or using Vite.

## Features

- **Streaming responses** with real-time message updates
- **MCP Integration** with dual transport support (Streamable HTTP & SSE Legacy)
- **Tool calling support** with local and remote tools
- **MathJax integration** for mathematical expressions with LaTeX rendering
- **Markdown rendering** with syntax highlighting  
- **Sidebar interface** with model selection and MCP server configuration
- **Full-screen interface** optimized for chat
- **Console tool logging** for debugging
- **Dual deployment**: Zero build (Babel) or Vite build process
- **Combined MCP Server** with unified math tools and flexible transport options

## Available Tools

### Local Tools
- **local_add_numbers(a, b)** - Add two numbers together

### MCP Server Tools
The MCP server includes complementary mathematical operations:
- **multiply_numbers(a, b)** - Multiply two numbers together
- **divide_numbers(a, b)** - Divide first number by second (with zero-division protection)

#### Server Options
- **SSE (default)**: `python mcp_server.py --port 8000` → `http://localhost:8000/sse`
- **HTTP**: `python mcp_server.py --transport http --port 8000` → `http://localhost:8000/mcp`

## MCP Transport Support

The interface supports both MCP transport protocols:

- **Streamable HTTP** - Modern transport using HTTP POST with streaming responses
- **SSE Legacy** - Legacy transport using Server-Sent Events with message correlation
- **Auto-detection** - Automatically detects which transport the server supports

## Development

### Starting the Chat Interface

Start the development server:

```bash
npm run dev
```

This will start Vite dev server on `http://localhost:8080` with hot module replacement.

### Starting the MCP Server

Start with SSE transport (default):
```bash
python mcp_server.py --port 8001
```

Start with HTTP transport:
```bash
python mcp_server.py --transport http --port 8001
```

With auto-reload for development:
```bash
python mcp_server.py --transport http --port 8001 --reload
```

The server includes CORS configuration for local development.

## Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

The build process automatically creates optimized assets in the `dist/` directory with relative paths for deployment.

## Usage

### Basic Chat
1. Enter your OpenRouter API key in the sidebar
2. Select an AI model from the dropdown
3. Start chatting - the interface supports markdown and LaTeX math expressions

### MCP Server Integration
1. Start the MCP server: `python mcp_server.py --port 8001`
2. Configure MCP server URL in the sidebar:
   - For SSE: `http://localhost:8001/sse` 
   - For HTTP: `http://localhost:8001/mcp`
3. Select transport protocol (Auto-detect, Streamable HTTP, or SSE Legacy)
4. The interface will automatically connect and load available tools
5. Use tools in your prompts - they'll appear in the model's function list

**MCP Server Features:**
- Complementary math operations (multiply, divide)
- Flexible transport selection via CLI
- Better error handling and logging
- Development auto-reload support

### Mathematical Expressions
The interface supports LaTeX math rendering:
- Inline math: `$x^2 + y^2 = z^2$`
- Display math: `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`

## Configuration

- API key is persisted in localStorage with automatic state synchronization
- Default model: `openai/gpt-4o-mini`
- MathJax supports `$...$` and `$$...$$` syntax with AMS extensions
- Tools are executed in parallel when possible
- MCP transport auto-detection with fallback support

## Project Structure

```
src/
├── main.jsx                    # App entry point with local tool setup
├── LLMChatInterface.jsx        # Main chat component with state management
├── hooks/                      # Custom React hooks
│   ├── useChatEngine.js        # Core chat logic with streaming
│   ├── useModelManager.js      # Model fetching and management
│   ├── useMarkdownRenderer.js  # MathJax integration
│   ├── useMCPManager.js        # MCP client management
│   └── useToolManager.js       # Tool execution and validation
├── components/                 # UI components
│   ├── Sidebar.jsx            # Settings and MCP configuration
│   ├── MessagesContainer.jsx   # Message display with auto-scroll
│   ├── MessageInput.jsx       # Input area with prompt templates
│   └── ErrorDisplay.jsx       # Error handling and display
├── utils/                      # Utilities and clients
│   ├── apiClient.js           # OpenRouter API client
│   ├── mcpClient.js           # MCP client with dual transport
│   ├── httpClient.js          # Common HTTP utilities
│   ├── mathProcessor.js       # MathJax utilities
│   └── constants.js           # Application constants
└── mcp_server.py             # MCP server with dual transport support
```

## Dependencies

### Runtime Dependencies
- React 18 with functional components and hooks
- OpenRouter API for LLM access
- MathJax 3 for mathematical expression rendering
- FastMCP for server implementations

### Development Dependencies  
- Vite for build tooling and development server
- ESLint for code linting
- Tailwind CSS for styling (CDN)

## Architecture Notes

- **Component Library Design** - Can be embedded in other React applications
- **Custom Hooks Pattern** - Modular state management without external libraries  
- **Dual Transport MCP** - Supports both modern and legacy MCP protocols
- **Dual Transport Architecture** - Single server supports both SSE and HTTP transports
- **Zero Config Math** - MathJax integration with automatic formula detection
- **CORS Enabled** - All servers configured for local development
- **Tool Execution Logging** - Comprehensive console logging for debugging
- **Development Optimized** - Auto-reload, rich CLI, and comprehensive error handling

The interface is designed as a reusable component with a comprehensive props API for embedding in larger applications while also functioning as a standalone chat interface.

## Server Usage Examples

The MCP server supports both transport protocols with flexible configuration:

**Basic Usage:**
```bash
# Default SSE transport on port 8000
python mcp_server.py

# HTTP transport on port 8001  
python mcp_server.py --transport http --port 8001

# Development with auto-reload
python mcp_server.py --transport http --port 8001 --reload
```

**Features:**
- ✅ Single server with dual transport support
- ✅ Complementary math operations (multiply, divide)
- ✅ Rich CLI interface with help
- ✅ Better error handling and logging
- ✅ Development auto-reload support