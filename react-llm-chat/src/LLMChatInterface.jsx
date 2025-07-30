import React from 'react';
import useChatEngine from './hooks/useChatEngine.js';
import useModelManager from './hooks/useModelManager.js';
import useMarkdownRenderer from './hooks/useMarkdownRenderer.js';
import ChatHeader from './components/ChatHeader.jsx';
import ErrorDisplay from './components/ErrorDisplay.jsx';
import MessagesContainer from './components/MessagesContainer.jsx';
import MessageInput from './components/MessageInput.jsx';

const LLMChatInterface = () => {
  const [apiKey, setApiKey] = React.useState(localStorage.getItem('openrouter-api-key') || '');
  const [displayMode, setDisplayMode] = React.useState('markdown');
  const [error, setError] = React.useState(null);
  const messagesEndRef = React.useRef(null);

  // Save API key to localStorage
  React.useEffect(() => {
    if (apiKey) {
      localStorage.setItem('openrouter-api-key', apiKey);
    }
  }, [apiKey]);

  const {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    clearMessages,
    currentModel,
    setCurrentModel,
    registerStreamingCallbacks
  } = useChatEngine(apiKey, "openai/gpt-4o-mini", "You are a helpful AI assistant. Please use dollar signs ($...$) and double dollar signs ($$...$$) for MathJax, and backslash any regular dollar signs (\\$) that are not for math.");
  
  const { models, modelsLoading } = useModelManager(null, apiKey);
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
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err);
    }
  };

  const handleClearMessages = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      clearMessages();
      setError(null);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header / Control Panel */}
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
      />
      
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