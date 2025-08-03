import React from 'react';
import useChatEngine from './hooks/useChatEngine.js';
import useModelManager from './hooks/useModelManager.js';
import useMarkdownRenderer from './hooks/useMarkdownRenderer.js';
import ChatHeader from './components/ChatHeader.jsx';
import ErrorDisplay from './components/ErrorDisplay.jsx';
import MessagesContainer from './components/MessagesContainer.jsx';
import MessageInput from './components/MessageInput.jsx';

const LLMChatInterface = ({
  apiKey: propApiKey = null,
  defaultModel = "openai/gpt-4o-mini",
  systemPrompt = "You are a helpful AI assistant. Please use dollar signs ($...$) and double dollar signs ($$...$$) for MathJax, and backslash any regular dollar signs (\\$) that are not for math.",
  tools = null,
  toolHandlers = null,
  enableTools = false,
  toolChoice = "auto",
  parallelToolCalls = true,
  onToolCall = null,
  customModels = null,
  className = "",
  height = "600px",
  showHeader = true,
  showModelSelector = true,
  showClearButton = true,
  showDisplayModeToggle = true,
  onMessage = null,
  onError = null,
  theme = "light"
}) => {
  const [apiKey, setApiKey] = React.useState(propApiKey || localStorage.getItem('openrouter-api-key') || '');
  const [displayMode, setDisplayMode] = React.useState('markdown');
  const [error, setError] = React.useState(null);
  const messagesEndRef = React.useRef(null);

  // Save API key to localStorage (only if not provided as prop)
  React.useEffect(() => {
    if (apiKey && !propApiKey) {
      localStorage.setItem('openrouter-api-key', apiKey);
    }
  }, [apiKey, propApiKey]);

  // Handle tool calling callback with user notification
  const handleToolCall = React.useCallback((toolName, args, result, error) => {
    if (onToolCall) {
      onToolCall(toolName, args, result, error);
    }
    
    if (error && onError) {
      onError(error);
    }
  }, [onToolCall, onError]);

  const {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    clearMessages,
    currentModel,
    setCurrentModel,
    registerStreamingCallbacks
  } = useChatEngine(
    apiKey, 
    defaultModel, 
    systemPrompt,
    enableTools ? tools : null,
    enableTools ? toolHandlers : null,
    toolChoice,
    parallelToolCalls,
    handleToolCall
  );
  
  const { models, modelsLoading } = useModelManager(customModels, apiKey);
  const { renderMessage } = useMarkdownRenderer(displayMode);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Auto-scroll effect - trigger after messages change
  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // MathJax rendering effect - trigger after messages change
  React.useEffect(() => {
    if (displayMode === 'markdown' && window.MathJax && window.MathJax.typesetPromise) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        window.MathJax.typesetPromise()
          .then(() => {
            // Scroll after MathJax rendering completes
            scrollToBottom();
          })
          .catch(err => console.error('MathJax rendering failed:', err));
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [messages, displayMode, scrollToBottom]);

  const handleSendMessage = async (message) => {
    if (!message.trim() || isLoading || isStreaming || !apiKey) return;
    
    try {
      setError(null);
      await sendMessage(message);
      
      // Notify parent component of message
      if (onMessage) {
        // Get the last assistant message from the messages array
        const lastAssistantMessage = messages
          .filter(msg => msg.role === 'assistant')
          .pop();
        onMessage(message, lastAssistantMessage?.content || '');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err);
      if (onError) {
        onError(err);
      }
    }
  };

  const handleClearMessages = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      clearMessages();
      setError(null);
    }
  };

  return (
    <div className={`llm-chat-container ${className} ${theme === 'dark' ? 'llm-chat-dark' : 'llm-chat-light'} flex flex-col`} style={{ height }}>
      {/* Header / Control Panel */}
      {showHeader && (
        <ChatHeader
          apiKey={apiKey}
          setApiKey={setApiKey}
          currentModel={currentModel}
          setCurrentModel={setCurrentModel}
          models={models}
          modelsLoading={modelsLoading}
          displayMode={displayMode}
          setDisplayMode={setDisplayMode}
          isLoading={isLoading || isStreaming}
          onClearMessages={handleClearMessages}
          messages={messages}
          showModelSelector={showModelSelector}
          showClearButton={showClearButton}
          showDisplayModeToggle={showDisplayModeToggle}
        />
      )}
      
      {/* Error Message Display Area */}
      <ErrorDisplay error={error} />
      
      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col p-2 sm:p-4 min-h-0">
        <div className="bg-white rounded-lg border border-gray-200 flex flex-col h-full min-h-0">
          
          {/* Messages Display Area */}
          <MessagesContainer
            messages={messages}
            isLoading={isLoading}
            isStreaming={isStreaming}
            renderMessage={renderMessage}
            messagesEndRef={messagesEndRef}
            registerStreamingCallbacks={registerStreamingCallbacks}
            displayMode={displayMode}
          />
          
          {/* Message Input Area */}
          <MessageInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading || isStreaming}
            apiKey={apiKey}
          />
        </div>
      </div>
    </div>
  );
};

export default LLMChatInterface;