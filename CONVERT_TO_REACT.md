# React Port Implementation Plan

## Project Overview

Convert the vanilla JavaScript LLM chat interface to a reusable React component that can be embedded in any web application without a build step. The component will use Babel for JSX transformation and maintain all existing functionality while improving reusability.

## Architecture Goals

1. **Zero Build Step**: Use Babel standalone for JSX transformation
2. **Reusable Component**: Clean props-based API for embedding
3. **Self-Contained**: All dependencies via CDN
4. **Backwards Compatible**: Maintain all existing features
5. **Embeddable**: Can be dropped into any React app or standalone

## File Structure

```
react-llm-chat/
├── index.html                    # Demo/standalone usage
├── src/
│   ├── LLMChatInterface.jsx      # Main React component
│   ├── hooks/
│   │   ├── useChatEngine.js      # Chat logic hook
│   │   ├── useMarkdownRenderer.js # Markdown processing hook
│   │   └── useModelManager.js    # Model fetching hook
│   ├── components/
│   │   ├── ChatHeader.jsx        # Header controls
│   │   ├── MessageList.jsx       # Messages display
│   │   ├── MessageInput.jsx      # Input area
│   │   └── ErrorDisplay.jsx      # Error handling
│   ├── utils/
│   │   ├── mathProcessor.js      # Math preprocessing utilities
│   │   ├── apiClient.js          # OpenRouter API client
│   │   └── constants.js          # App constants
│   └── styles/
│       └── chat.css              # Component styles
├── demo.html                     # Usage examples
├── README.md                     # Documentation
└── package.json                  # Metadata (no deps)
```

## Implementation Phases

### Phase 1: Core Component Structure

#### 1.1 Main Component (`LLMChatInterface.jsx`)
```jsx
const LLMChatInterface = ({
  apiKey,
  defaultModel = "openai/gpt-4o-mini",
  systemPrompt = "You are a helpful AI assistant...",
  className = "",
  height = "600px",
  showHeader = true,
  showModelSelector = true,
  showClearButton = true,
  onMessage = null,
  onError = null,
  customModels = null,
  theme = "light"
}) => {
  // Component implementation
};
```

**Props Design:**
- `apiKey`: OpenRouter API key (required)
- `defaultModel`: Initial model selection
- `systemPrompt`: Custom system prompt
- `className`: Additional CSS classes
- `height`: Component height
- `showHeader`: Toggle header visibility
- `showModelSelector`: Toggle model dropdown
- `showClearButton`: Toggle clear button
- `onMessage`: Callback for message events
- `onError`: Callback for error handling
- `customModels`: Override model list
- `theme`: UI theme (light/dark)

#### 1.2 State Management Strategy
```javascript
// Use React hooks instead of custom store
const [messages, setMessages] = useState([]);
const [currentModel, setCurrentModel] = useState(defaultModel);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
```

### Phase 2: Custom Hooks

#### 2.1 Chat Engine Hook (`useChatEngine.js`)
```javascript
const useChatEngine = (apiKey, model, systemPrompt) => {
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const sendMessage = useCallback(async (message) => {
    // Streaming logic
  }, [apiKey, model]);
  
  const clearMessages = useCallback(() => {
    // Clear logic
  }, [systemPrompt]);
  
  return {
    messages,
    sendMessage,
    clearMessages,
    isStreaming
  };
};
```

#### 2.2 Markdown Renderer Hook (`useMarkdownRenderer.js`)
```javascript
const useMarkdownRenderer = (displayMode = 'markdown') => {
  const renderMessage = useCallback((content, role) => {
    if (displayMode === 'text') {
      return renderPlainText(content);
    }
    return renderMarkdownWithMath(content);
  }, [displayMode]);
  
  return { renderMessage };
};
```

#### 2.3 Model Manager Hook (`useModelManager.js`)
```javascript
const useModelManager = (customModels) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (customModels) {
      setModels(customModels);
      setLoading(false);
    } else {
      fetchModelsFromAPI();
    }
  }, [customModels]);
  
  return { models, loading };
};
```

### Phase 3: Component Implementation

#### 3.1 Chat Header Component (`ChatHeader.jsx`)
```jsx
const ChatHeader = ({
  apiKey,
  onApiKeyChange,
  model,
  onModelChange,
  models,
  displayMode,
  onDisplayModeChange,
  onClear,
  showModelSelector,
  showClearButton,
  error
}) => {
  return (
    <div className="llm-chat-header">
      {/* Header controls */}
    </div>
  );
};
```

#### 3.2 Message List Component (`MessageList.jsx`)
```jsx
const MessageList = ({
  messages,
  displayMode,
  isStreaming,
  className
}) => {
  const messagesEndRef = useRef(null);
  const { renderMessage } = useMarkdownRenderer(displayMode);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="llm-chat-messages">
      {/* Message rendering */}
    </div>
  );
};
```

#### 3.3 Message Input Component (`MessageInput.jsx`)
```jsx
const MessageInput = ({
  onSend,
  disabled,
  placeholder
}) => {
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Input implementation */}
    </form>
  );
};
```

### Phase 4: Utilities and Services

#### 4.1 Math Processor (`mathProcessor.js`)
```javascript
export const preprocessMarkdownForMath = (markdown) => {
  // Convert from class-based to functional approach
  // Maintain exact same logic but as pure functions
};

export const renderMathWithMathJax = (element) => {
  // MathJax rendering utility
};
```

#### 4.2 API Client (`apiClient.js`)
```javascript
export class OpenRouterClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  
  async streamCompletion(messages, model, onChunk, onComplete) {
    // Streaming implementation
  }
  
  async getCompletion(messages, model) {
    // Non-streaming fallback
  }
  
  async getModels() {
    // Model fetching
  }
}
```

### Phase 5: Styling and CSS

#### 5.1 Component Styles (`chat.css`)
```css
/* Scoped CSS using CSS modules approach */
.llm-chat-container {
  /* Base container styles */
  --llm-chat-primary: #3b82f6;
  --llm-chat-secondary: #6b7280;
  --llm-chat-background: #ffffff;
  --llm-chat-border: #e5e7eb;
}

.llm-chat-container.theme-dark {
  --llm-chat-primary: #60a5fa;
  --llm-chat-secondary: #9ca3af;
  --llm-chat-background: #1f2937;
  --llm-chat-border: #374151;
}

/* All existing styles prefixed with .llm-chat- */
```

#### 5.2 CSS Isolation Strategy
- Prefix all CSS classes with `llm-chat-`
- Use CSS custom properties for theming
- Avoid global style pollution
- Maintain Tailwind compatibility

### Phase 6: Integration and Usage

#### 6.1 Standalone HTML (`index.html`)
```html
<!DOCTYPE html>
<html>
<head>
  <title>LLM Chat Interface</title>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- MathJax config and load -->
  <link href="src/styles/chat.css" rel="stylesheet">
</head>
<body>
  <div id="chat-root"></div>
  
  <script type="text/babel" data-type="module">
    import LLMChatInterface from './src/LLMChatInterface.jsx';
    
    const App = () => {
      const [apiKey, setApiKey] = React.useState('');
      
      return (
        <div className="p-4">
          <h1>LLM Chat Demo</h1>
          <LLMChatInterface
            apiKey={apiKey}
            height="70vh"
            onMessage={(message, response) => console.log('Chat:', message, response)}
            onError={(error) => console.error('Chat Error:', error)}
          />
        </div>
      );
    };
    
    ReactDOM.render(<App />, document.getElementById('chat-root'));
  </script>
</body>
</html>
```

#### 6.2 Embeddable Usage Examples
```jsx
// Simple embedding
<LLMChatInterface apiKey="your-key" />

// Customized embedding
<LLMChatInterface
  apiKey="your-key"
  defaultModel="anthropic/claude-3-sonnet"
  systemPrompt="You are a coding assistant."
  height="500px"
  theme="dark"
  showModelSelector={false}
  onMessage={(msg, resp) => logConversation(msg, resp)}
  className="my-custom-chat"
/>

// Controlled component
<LLMChatInterface
  apiKey={apiKey}
  customModels={[
    { id: "gpt-4", name: "GPT-4" },
    { id: "claude-3", name: "Claude 3" }
  ]}
  onError={handleChatError}
/>
```

## Implementation Tasks

### Task 1: Project Setup
- [ ] Create new directory structure
- [ ] Set up HTML with React + Babel
- [ ] Configure MathJax for React
- [ ] Create base CSS architecture

### Task 2: Core Component
- [ ] Create `LLMChatInterface.jsx` with props API
- [ ] Implement state management with hooks
- [ ] Add prop validation and defaults
- [ ] Test basic rendering

### Task 3: Custom Hooks
- [ ] Implement `useChatEngine` hook
- [ ] Create `useMarkdownRenderer` hook
- [ ] Build `useModelManager` hook
- [ ] Add error handling hooks

### Task 4: Sub-components
- [ ] Build `ChatHeader` component
- [ ] Create `MessageList` component
- [ ] Implement `MessageInput` component
- [ ] Add `ErrorDisplay` component

### Task 5: Utilities Migration
- [ ] Convert math processing to pure functions
- [ ] Create API client class
- [ ] Port streaming logic
- [ ] Add TypeScript-style prop validation

### Task 6: Styling System
- [ ] Create scoped CSS system
- [ ] Implement theming variables
- [ ] Port all existing styles
- [ ] Add responsive design improvements

### Task 7: Integration Testing
- [ ] Test standalone usage
- [ ] Test embedding scenarios
- [ ] Verify all features work
- [ ] Performance optimization

### Task 8: Documentation
- [ ] Write comprehensive README
- [ ] Create usage examples
- [ ] Document props API
- [ ] Add troubleshooting guide

## Key Considerations

### Reusability Requirements
1. **Clean Props API**: Well-defined, optional props with sensible defaults
2. **Event Callbacks**: Allow parent components to react to chat events
3. **Styling Isolation**: No global CSS pollution
4. **Dependency Management**: All dependencies via CDN
5. **Error Boundaries**: Graceful error handling

### Backwards Compatibility
1. **Feature Parity**: All existing features preserved
2. **API Compatibility**: Same OpenRouter integration
3. **Math Rendering**: Identical LaTeX processing
4. **Streaming**: Same real-time experience

### Performance Considerations
1. **Memo Usage**: Optimize re-renders with React.memo
2. **Callback Optimization**: Use useCallback for stable references
3. **Lazy Loading**: Code splitting if needed
4. **Memory Management**: Proper cleanup in effects

### Accessibility Implementation
1. **ARIA Labels**: Comprehensive screen reader support
2. **Keyboard Navigation**: Full keyboard accessibility
3. **Focus Management**: Proper focus handling during streaming
4. **Semantic HTML**: Use proper heading hierarchy and landmarks
5. **Color Contrast**: Ensure sufficient contrast in both themes

#### ARIA Implementation Details
```jsx
// Main Component ARIA Structure
<div
  className="llm-chat-container"
  role="application"
  aria-label="AI Chat Interface"
  aria-describedby="chat-description"
>
  <div id="chat-description" className="sr-only">
    Interactive chat interface for communicating with AI models
  </div>

  {/* Header with controls */}
  <header className="llm-chat-header" role="banner">
    <div role="group" aria-labelledby="chat-controls-heading">
      <h2 id="chat-controls-heading" className="sr-only">Chat Controls</h2>
      
      <select
        aria-label="Select AI model"
        value={currentModel}
        onChange={handleModelChange}
        disabled={isStreaming}
      >
        {models.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>

      <button
        aria-label="Clear chat history"
        onClick={clearMessages}
        disabled={isStreaming || messages.length === 0}
        aria-describedby="clear-help"
      >
        Clear
      </button>
      <div id="clear-help" className="sr-only">
        Removes all messages from the current conversation
      </div>
    </div>
  </header>

  {/* Messages area */}
  <main
    className="llm-chat-messages"
    role="log"
    aria-live="polite"
    aria-label="Chat conversation"
    tabIndex={0}
  >
    {messages.map((message, index) => (
      <div
        key={message.id}
        className={`message message-${message.role}`}
        role="article"
        aria-labelledby={`message-${index}-label`}
      >
        <div id={`message-${index}-label`} className="sr-only">
          {message.role === 'user' ? 'Your message' : 'AI response'}
        </div>
        <div
          className="message-content"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
          aria-label={message.role === 'user' ? 'Your message' : 'AI response'}
        />
      </div>
    ))}
    
    {isStreaming && (
      <div
        role="status"
        aria-live="assertive"
        aria-label="AI is typing"
        className="typing-indicator"
      >
        <span className="sr-only">AI is generating a response</span>
        <div aria-hidden="true">●●●</div>
      </div>
    )}
  </main>

  {/* Input area */}
  <footer className="llm-chat-input" role="contentinfo">
    <form onSubmit={handleSubmit} role="search">
      <label htmlFor="message-input" className="sr-only">
        Type your message to the AI
      </label>
      <textarea
        id="message-input"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={isStreaming}
        aria-describedby="input-help"
        rows={1}
        style={{ resize: 'none' }}
      />
      <div id="input-help" className="sr-only">
        Press Enter to send, Shift+Enter for new line
      </div>
      
      <button
        type="submit"
        disabled={isStreaming || !inputValue.trim()}
        aria-label={isStreaming ? 'Please wait, AI is responding' : 'Send message'}
      >
        {isStreaming ? 'Sending...' : 'Send'}
      </button>
    </form>
  </footer>

  {/* Error display */}
  {error && (
    <div
      role="alert"
      aria-live="assertive"
      className="llm-chat-error"
    >
      <h3>Error</h3>
      <p>{error.message}</p>
    </div>
  )}
</div>
```

#### Keyboard Navigation Support
```jsx
// Enhanced input component with keyboard handling
const MessageInput = ({ onSend, disabled }) => {
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
      setInputValue('');
      textareaRef.current?.focus();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [inputValue]);

  return (
    <div className="message-input-container">
      <textarea
        ref={textareaRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={disabled}
        aria-label="Message input"
        aria-describedby="input-instructions"
        className="message-input"
      />
      <div id="input-instructions" className="sr-only">
        Press Enter to send message, Shift+Enter for new line, Escape to clear
      </div>
    </div>
  );
};
```

#### Screen Reader CSS
```css
/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focus indicators */
.llm-chat-container *:focus {
  outline: 2px solid var(--llm-chat-primary);
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .llm-chat-container {
    --llm-chat-border: ButtonText;
    --llm-chat-background: ButtonFace;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .llm-chat-messages {
    scroll-behavior: auto;
  }
  
  .typing-indicator {
    animation: none;
  }
}
```

### Browser Support
1. **ES6+ Features**: Modern JavaScript (same as original)
2. **React 18**: Latest stable React features
3. **Babel Transform**: JSX transformation for older browsers
4. **CDN Dependencies**: No local build requirements

## Success Criteria

1. ✅ **Component renders** in standalone HTML
2. ✅ **All features work** identically to original
3. ✅ **Easy embedding** in existing React apps
4. ✅ **Props API** provides full customization
5. ✅ **No build step** required for usage
6. ✅ **Clean separation** of concerns
7. ✅ **Performance** matches or exceeds original
8. ✅ **Documentation** enables easy adoption

This plan provides a complete roadmap for converting the vanilla JavaScript chat interface into a highly reusable React component while maintaining all existing functionality and improving embeddability.
