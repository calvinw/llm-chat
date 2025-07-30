# LLM Chat Interface - React Component

A reusable React component for creating chat interfaces with Large Language Models using the OpenRouter API. Features streaming responses, markdown rendering with MathJax support, and zero build step deployment.

## ✨ Features

- 🚀 **Zero Build Step** - Uses Babel standalone for JSX transformation
- 💬 **Streaming Responses** - Real-time message streaming with fallback
- 📝 **Markdown Support** - Full markdown rendering with MathJax for LaTeX
- 🎨 **Customizable** - Extensive props API for customization
- ♿ **Accessible** - Full ARIA support and keyboard navigation
- 🌙 **Dark Mode** - Built-in theming support
- 📱 **Responsive** - Mobile-friendly design
- 🔒 **Secure** - XSS protection and safe HTML rendering

## 🚀 Quick Start

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <!-- React CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <!-- Dependencies -->
    <script src="https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- MathJax -->
    <script>
        window.MathJax = {
            tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']] }
        };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    
    <!-- Component CSS -->
    <link href="src/styles/chat.css" rel="stylesheet">
</head>
<body>
    <div id="chat-root"></div>
    
    <script type="text/babel" data-type="module">
        import LLMChatInterface from './src/LLMChatInterface.jsx';
        
        const App = () => (
            <LLMChatInterface apiKey="your-openrouter-api-key" />
        );
        
        const root = ReactDOM.createRoot(document.getElementById('chat-root'));
        root.render(<App />);
    </script>
</body>
</html>
```

### Customized Usage

```jsx
<LLMChatInterface
    apiKey="your-api-key"
    defaultModel="anthropic/claude-3-sonnet"
    systemPrompt="You are a helpful coding assistant."
    height="500px"
    theme="dark"
    showModelSelector={false}
    onMessage={(message, response) => console.log('Chat:', message, response)}
    onError={(error) => console.error('Error:', error)}
/>
```

## 📖 Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | **required** | OpenRouter API key |
| `defaultModel` | `string` | `"openai/gpt-4o-mini"` | Initial model selection |
| `systemPrompt` | `string` | Default assistant prompt | Custom system prompt |
| `className` | `string` | `""` | Additional CSS classes |
| `height` | `string` | `"600px"` | Component height |
| `showHeader` | `boolean` | `true` | Show/hide header controls |
| `showModelSelector` | `boolean` | `true` | Show/hide model dropdown |
| `showClearButton` | `boolean` | `true` | Show/hide clear button |
| `showDisplayModeToggle` | `boolean` | `true` | Show/hide display mode toggle |
| `onMessage` | `function` | `null` | Callback for message events |
| `onError` | `function` | `null` | Callback for errors |
| `customModels` | `array` | `null` | Override default model list |
| `theme` | `string` | `"light"` | UI theme (`"light"` or `"dark"`) |

## 🎨 Styling

The component uses scoped CSS classes prefixed with `llm-chat-` to avoid conflicts. You can customize the appearance by overriding CSS custom properties:

```css
.llm-chat-container {
    --llm-chat-primary: #your-color;
    --llm-chat-background: #your-background;
    /* ... other variables */
}
```

## 🔧 Development

```bash
# Start development server
python -m http.server 8080

# Open in browser
http://localhost:8080
```

## 📁 Project Structure

```
react-llm-chat/
├── src/
│   ├── LLMChatInterface.jsx      # Main component
│   ├── hooks/
│   │   ├── useChatEngine.js      # Chat logic hook
│   │   ├── useMarkdownRenderer.js # Markdown rendering
│   │   └── useModelManager.js    # Model management
│   ├── components/
│   │   ├── ChatHeader.jsx        # Header controls
│   │   ├── MessageList.jsx       # Message display
│   │   ├── MessageInput.jsx      # Input area
│   │   └── ErrorDisplay.jsx      # Error handling
│   ├── utils/
│   │   ├── apiClient.js          # OpenRouter API client
│   │   ├── mathProcessor.js      # Math rendering utilities
│   │   └── constants.js          # App constants
│   └── styles/
│       └── chat.css              # Component styles
├── index.html                    # Basic demo
├── demo.html                     # Usage examples
└── README.md                     # This file
```

## 🧪 Examples

See `demo.html` for comprehensive usage examples including:

- Basic chat interface
- Customized styling and behavior
- Dark theme implementation
- Minimal interface without controls

## 🔑 API Key

Get your OpenRouter API key from [OpenRouter.ai](https://openrouter.ai). The component supports all models available through OpenRouter.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- 📚 [Documentation](https://github.com/your-repo/llm-chat-interface/docs)
- 🐛 [Issue Tracker](https://github.com/your-repo/llm-chat-interface/issues)
- 💬 [Discussions](https://github.com/your-repo/llm-chat-interface/discussions)

---

Built with ❤️ for the AI community