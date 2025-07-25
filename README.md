# LLM Chat

A web-based chat interface for Large Language Models using OpenRouter's API. Features real-time streaming responses, markdown rendering with MathJax support, and multiple model selection.

## Features

- **Real-time Streaming**: Optimized streaming with performance throttling
- **Markdown Support**: Full markdown rendering with MathJax for mathematical expressions
- **Multiple Models**: Easy switching between different LLM models via OpenRouter
- **Responsive Design**: Clean, responsive interface using Tailwind CSS
- **Math Rendering**: Support for LaTeX math expressions with MathJax
- **Performance Optimized**: Incremental DOM updates for smooth streaming even with long conversations

## Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/llm-chat.git
   cd llm-chat
   ```

2. **Get an OpenRouter API key**:
   - Sign up at [OpenRouter.ai](https://openrouter.ai/)
   - Get your API key from the dashboard

3. **Run the development server**:
   ```bash
   pip install livereload
   python serve.py
   ```

4. **Open your browser**:
   - Navigate to `http://localhost:5500`
   - Enter your OpenRouter API key
   - Start chatting!

## Usage

- **API Key**: Enter your OpenRouter API key in the top field
- **Model Selection**: Choose from available models in the dropdown
- **Display Mode**: Switch between Markdown and Plain Text rendering
- **Clear Messages**: Reset the conversation history

## Architecture

- **Frontend**: Vanilla JavaScript with ES6 modules
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Custom lightweight store implementation
- **API Integration**: OpenRouter API with streaming support
- **Math Rendering**: MathJax for LaTeX expressions

## Files

- `index.html` - Main application interface
- `chat-engine.js` - Core chat functionality and API communication
- `editor.js` - UI logic and DOM manipulation
- `fetch-models.js` - Model fetching and dropdown population
- `defaults.js` - Default configuration
- `styles.css` - Custom CSS styles
- `serve.py` - Development server with live reload

## Development

No build process required. The application runs directly in the browser using ES6 modules and CDN resources.

For development with live reload:
```bash
python serve.py
```

## License

MIT License - see LICENSE file for details.
