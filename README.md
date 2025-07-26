# LLM Chat Interface

A modern, feature-rich web-based chat interface for Large Language Models using OpenRouter's API. Built with vanilla JavaScript, featuring real-time streaming responses, markdown rendering, and full LaTeX math support.

## ✨ Features

### 🚀 Core Functionality
- **Real-time streaming responses** - See AI responses appear as they're generated
- **Multiple AI models** - Switch between different models from OpenRouter
- **Markdown rendering** - Full markdown support with syntax highlighting
- **LaTeX math rendering** - Complete mathematical notation support via MathJax
- **Dual display modes** - Switch between formatted markdown and plain text views

### 🎯 Advanced Features
- **Math expression protection** - Intelligent preprocessing prevents markdown from corrupting LaTeX
- **Display vs inline math** - Proper support for both `$inline$` and `$$display$$` math
- **Streaming optimization** - Throttled UI updates for smooth performance
- **Error handling** - Graceful fallback to non-streaming mode if needed
- **Responsive design** - Works seamlessly on desktop, tablet, and mobile

### 🛡️ Technical Highlights
- **No build pipeline** - Runs directly in browser using ES6 modules
- **State management** - Custom lightweight store with subscription system
- **Memory efficient** - Incremental message updates during streaming
- **CORS compliant** - Proper headers for OpenRouter API integration

## 🏗️ Architecture

### File Structure
```
llm-chat/
├── index.html          # Main HTML interface
├── styles.css          # Custom styles and chat message formatting
├── editor.js           # UI controller and message rendering
├── chat-engine.js      # Core chat logic and API communication
├── fetch-models.js     # Model fetching and dropdown population
├── defaults.js         # Configuration defaults
├── serve.py           # Development server with live reload
└── README.md          # This file
```

### Component Architecture

#### 1. **ChatEngine** (`chat-engine.js`)
- **Purpose**: Core chat functionality and API communication
- **Features**:
  - OpenRouter API integration with streaming support
  - State management using custom Store class
  - Automatic fallback from streaming to non-streaming
  - Message history and conversation management

#### 2. **UI Controller** (`editor.js`)
- **Purpose**: User interface management and message rendering
- **Features**:
  - Dual rendering modes (Markdown vs Plain Text)
  - LaTeX math preprocessing and protection
  - Incremental message updates during streaming
  - Display mode switching with proper font handling

#### 3. **Model Management** (`fetch-models.js`)
- **Purpose**: Fetch and manage available AI models
- **Features**:
  - Dynamic model dropdown population
  - Alphabetical sorting for easy browsing
  - Default model selection and persistence

#### 4. **Math Processing System**
- **Placeholder Protection**: Replaces math expressions with safe placeholders before markdown processing
- **Order-sensitive Processing**: Handles display math (`$$`) before inline math (`$`) to prevent conflicts
- **MathJax Integration**: Renders LaTeX expressions with full AMS math package support
- **Browser Compatibility**: Handles system-level text replacement issues

## 🚀 Getting Started

### Prerequisites
- Modern web browser with ES6 module support
- OpenRouter API key ([get one here](https://openrouter.ai/))
- Python 3.x (for development server)

### Quick Start

1. **Clone or download** the project files
2. **Install live reload dependency**:
   ```bash
   pip install livereload
   ```
3. **Start the development server**:
   ```bash
   python serve.py
   ```
4. **Open your browser** to `http://localhost:5500`
5. **Enter your OpenRouter API key** in the interface
6. **Start chatting!**

### Production Deployment
- Serve files from any web server (Apache, Nginx, etc.)
- No build process required - just serve the static files
- Replace Tailwind CDN with production build for better performance

## 🔧 Configuration

### API Key Setup
The application requires an OpenRouter API key to function. You can:
- Enter it directly in the web interface (recommended for development)
- Modify `defaults.js` to include your key (not recommended for production)

### Default Model
Change the default AI model by editing `DEFAULT_MODEL` in `defaults.js`:
```javascript
const DEFAULT_MODEL = "openai/gpt-4o-mini"; // Change this to your preferred model
```

### System Prompt
Customize the default system prompt in `defaults.js`:
```javascript
const DEFAULT_SYSTEM_PROMPT = "Your custom system prompt here...";
```

## 📝 Usage Guide

### Basic Chat
1. Enter your OpenRouter API key
2. Select an AI model from the dropdown
3. Type your message and press Enter or click Send
4. Watch the AI response stream in real-time

### Markdown Formatting
The interface supports full markdown syntax:
- **Bold text**: `**bold**` or `__bold__`
- *Italic text*: `*italic*` or `_italic_`
- `Code`: `` `code` ``
- Lists, headers, links, and more

### LaTeX Math
Use LaTeX notation for mathematical expressions:
- **Inline math**: `$E = mc^2$` renders as $E = mc^2$
- **Display math**: `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`

### Display Modes
- **Markdown Mode**: Full formatting with math rendering
- **Plain Text Mode**: Monospace font, no formatting (useful for code)

## 🛠️ Development

### Code Organization
The codebase follows a modular architecture with clear separation of concerns:

- **State Management**: Custom store implementation with subscription system
- **Event-Driven Architecture**: Reactive UI updates based on state changes
- **Streaming Optimization**: Throttled updates for smooth real-time experience
- **Error Handling**: Comprehensive error catching with user-friendly messages

### Key Technical Decisions

1. **No Framework Dependencies**: Pure vanilla JavaScript for maximum compatibility
2. **ES6 Modules**: Modern module system for clean code organization
3. **Custom State Management**: Lightweight alternative to heavyweight frameworks
4. **Math Preprocessing**: Novel approach to protect LaTeX from markdown corruption
5. **Streaming First**: Prioritizes real-time experience with fallback support

### Adding New Features

The modular architecture makes it easy to extend:

1. **New Rendering Modes**: Add to `updateMessagesUI()` function
2. **Additional Models**: Modify `fetch-models.js` filtering logic
3. **Custom Math Processing**: Extend `preprocessMarkdownForMath()` function
4. **New API Providers**: Replace OpenRouter integration in `chat-engine.js`

## 🔍 Troubleshooting

### Common Issues

**"CORS Error"**: 
- Ensure you're running from a web server, not opening `index.html` directly
- Use the provided `serve.py` development server

**"Math not rendering"**:
- Check browser console for MathJax errors
- Ensure proper LaTeX syntax (escaped backslashes, etc.)

**"Models not loading"**:
- Verify your OpenRouter API key is valid
- Check network connectivity to openrouter.ai

**"Display mode switching broken"**:
- Hard refresh the page (Ctrl+F5) to clear cached JavaScript
- Check browser console for JavaScript errors

### Browser Compatibility
- **Recommended**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Minimum**: Any browser with ES6 module support
- **Note**: MathJax requires modern JavaScript features

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional markdown extensions
- More sophisticated math preprocessing
- UI/UX enhancements
- Performance optimizations
- Additional API provider support

## 🙏 Acknowledgments

- **OpenRouter** for providing the AI model API
- **MathJax** for exceptional LaTeX rendering
- **markdown-it** for robust markdown processing
- **Tailwind CSS** for rapid UI development