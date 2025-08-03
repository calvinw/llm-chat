# React LLM Chat Interface

A React-based chat interface component for Large Language Models using OpenRouter's API. Features streaming responses, tool calling support, markdown rendering with MathJax, and can be deployed with zero build steps or using Vite.

## Features

- **Streaming responses** with real-time message updates
- **Tool calling support** with greet and timezone tools
- **MathJax integration** for mathematical expressions  
- **Markdown rendering** with syntax highlighting
- **Full-screen interface** optimized for chat
- **Console tool logging** for debugging
- **Dual deployment**: Zero build (Babel) or Vite build process

## Development

Start the development server:

```bash
npm run dev
```

This will start Vite dev server on `http://localhost:8080` with hot module replacement.

## Build

Create a production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Usage

The interface includes two example tools:

- **greet(name, style)** - Generate personalized greetings
- **get_time(timezone)** - Get current time in specified timezone

Tool execution logs are shown in the browser console (F12).

## Configuration

- API key is persisted in localStorage
- Default model: `openai/gpt-4o-mini`
- MathJax supports `$...$` and `$$...$$` syntax
- Tools are executed in parallel when possible

## Project Structure

```
src/
├── main.jsx                    # App entry point with tool setup
├── LLMChatInterface.jsx        # Main chat component
├── hooks/                      # Custom React hooks
├── components/                 # UI components
└── utils/                      # Utilities and API client
```