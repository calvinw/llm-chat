import React from 'react';
import useChatEngine from './hooks/useChatEngine.js';
import useModelManager from './hooks/useModelManager.js';
import useMarkdownRenderer from './hooks/useMarkdownRenderer.js';
import useMCPManager from './hooks/useMCPManager.js';
import ChatHeader from './components/ChatHeader.jsx';
import ErrorDisplay from './components/ErrorDisplay.jsx';
import MessagesContainer from './components/MessagesContainer.jsx';
import MessageInput from './components/MessageInput.jsx';
import Sidebar from './components/Sidebar.jsx';

const LLMChatInterface = ({
  apiKey: propApiKey = null,
  defaultModel = "openai/gpt-4o-mini",
  systemPrompt = "",
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
  const [sidebarVisible, setSidebarVisible] = React.useState(true);
  const messagesEndRef = React.useRef(null);

  // MCP Manager for remote tool servers
  const {
    mcpServerUrl,
    setMcpServerUrl,
    mcpConnectionStatus,
    mcpTools,
    mcpToolHandlers,
    mcpClient
  } = useMCPManager();

  // Save API key to localStorage (only if not provided as prop)
  React.useEffect(() => {
    if (apiKey && !propApiKey) {
      localStorage.setItem('openrouter-api-key', apiKey);
    }
  }, [apiKey, propApiKey]);

  // Merge local tools with MCP tools
  const mergedTools = React.useMemo(() => {
    if (!enableTools) return null;
    
    const localTools = tools || [];
    const allTools = [...localTools, ...mcpTools];
    
        
    return allTools;
  }, [enableTools, tools, mcpTools]);

  // Merge local tool handlers with MCP tool handlers
  const mergedToolHandlers = React.useMemo(() => {
    if (!enableTools) return null;
    
    const localHandlers = toolHandlers || {};
    const allHandlers = { ...localHandlers, ...mcpToolHandlers };
    
        
    return allHandlers;
  }, [enableTools, toolHandlers, mcpToolHandlers]);

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
    mergedTools,
    mergedToolHandlers,
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

  // MathJax rendering effect - only trigger when streaming stops
  React.useEffect(() => {
    if (displayMode === 'markdown' && !isStreaming && window.MathJax && window.MathJax.typesetPromise) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        window.MathJax.typesetPromise()
          .catch(err => console.error('MathJax rendering failed:', err));
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isStreaming, displayMode]);


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

  const handleNewChat = () => {
    if (window.confirm('Are you sure you want to start a new chat?')) {
      clearMessages();
      setError(null);
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className={`llm-chat-container ${className} ${theme === 'dark' ? 'llm-chat-dark' : 'llm-chat-light'} flex h-full`} style={{ height }}>
      {/* Sidebar */}
      <Sidebar
        isVisible={sidebarVisible}
        onToggle={toggleSidebar}
        onNewChat={handleNewChat}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        displayMode={displayMode}
        onDisplayModeChange={setDisplayMode}
        currentModel={currentModel}
        setCurrentModel={setCurrentModel}
        models={models}
        modelsLoading={modelsLoading}
        isLoading={isLoading || isStreaming}
        mcpServerUrl={mcpServerUrl}
        onMcpServerUrlChange={setMcpServerUrl}
        mcpConnectionStatus={mcpConnectionStatus}
      />
      
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 h-full ${sidebarVisible ? 'lg:ml-[260px] ml-0' : 'lg:ml-[60px] ml-0'}`}>
        {/* Error Message Display Area */}
        <ErrorDisplay error={error} />
        
        {/* Messages Display Area - takes remaining space */}
        <MessagesContainer
          messages={messages}
          isLoading={isLoading}
          isStreaming={isStreaming}
          renderMessage={renderMessage}
          messagesEndRef={messagesEndRef}
          registerStreamingCallbacks={registerStreamingCallbacks}
          displayMode={displayMode}
          tools={mergedTools}
        />
        
        {/* Welcome message when no messages */}
        {messages.length === 0 && (
          <div className="flex items-center justify-center p-8">
            <h1 className="text-2xl font-semibold text-gray-800">What's on your mind today?</h1>
          </div>
        )}
        
        {/* Message Input Area - anchored to bottom */}
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading || isStreaming}
          apiKey={apiKey}
        />
      </div>
    </div>
  );
};

export default LLMChatInterface;