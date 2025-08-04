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

## Available Tools

### Local Tools
- **local_add_numbers(a, b)** - Add two numbers together

### MCP Server Tools (Streamable HTTP)
- **mcp_subtract_numbers(a, b)** - Subtract second number from first number
- Server runs on `http://localhost:8001/mcp`

### SSE Legacy Server Tools  
- **sse_multiply_numbers(a, b)** - Multiply two numbers together
- Server runs on `http://localhost:8002/sse`

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

### Starting MCP Servers

Start the MCP server (Streamable HTTP):

```bash
python mcp_server.py
```

Start the SSE Legacy server:

```bash  
python sse_server.py
```

Both servers include CORS configuration for local development.

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
1. Configure MCP server URL in the sidebar (e.g., `http://localhost:8001/mcp`)
2. Select transport protocol (Auto-detect, Streamable HTTP, or SSE Legacy)
3. The interface will automatically connect and load available tools
4. Use tools in your prompts - they'll appear in the model's function list

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
│   ├── mathProcessor.js       # MathJax utilities
│   └── constants.js           # Application constants
├── mcp_server.py              # FastMCP server (Streamable HTTP)
└── sse_server.py              # FastMCP server (SSE Legacy)
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
- **Zero Config Math** - MathJax integration with automatic formula detection
- **CORS Enabled** - All servers configured for local development
- **Tool Execution Logging** - Comprehensive console logging for debugging

The interface is designed as a reusable component with a comprehensive props API for embedding in larger applications while also functioning as a standalone chat interface.