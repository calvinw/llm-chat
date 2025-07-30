import React from 'react';

const ChatHeader = ({
  apiKey,
  setApiKey,
  currentModel,
  setCurrentModel,
  models,
  modelsLoading,
  displayMode,
  setDisplayMode,
  isLoading,
  onClearMessages,
  messages
}) => {
  const handleClearMessages = () => {
    if (window.confirm('Are you sure you want to clear all messages?')) {
      onClearMessages();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-3 flex-shrink-0">
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid xl:grid-cols-4 gap-3">
        
        {/* API Key Input */}
        <div className="flex items-center gap-2 md:col-span-3 xl:col-span-1">
          <label className="text-sm font-medium text-gray-600 shrink-0">API Key:</label>
          <form onSubmit={(e) => e.preventDefault()} className="flex-1">
            <input 
              type="password" 
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter OpenRouter API key..."
              title="Enter your OpenRouter API key to start chatting"
            />
          </form>
        </div>
        
        {/* Model Selection Dropdown */}
        <div className="flex items-center gap-2 md:col-span-2 xl:col-span-1">
          <label className="text-sm font-medium text-gray-600 shrink-0">Model:</label>
          <select 
            className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={currentModel}
            onChange={(e) => setCurrentModel(e.target.value)}
            disabled={isLoading || modelsLoading}
            title="Choose which AI model to use for responses"
          >
            {modelsLoading ? (
              <option value="">Loading models...</option>
            ) : (
              models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.id}
                </option>
              ))
            )}
          </select>
        </div>
        
        {/* Display Mode Selection */}
        <div className="flex items-center gap-2 md:col-span-1 xl:col-span-1">
          <span className="text-sm text-gray-600 shrink-0">Style:</span>
          <select 
            className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
            value={displayMode}
            onChange={(e) => setDisplayMode(e.target.value)}
            disabled={isLoading}
            title="Switch between markdown formatting and plain text display"
          >
            <option value="markdown">Markdown</option>
            <option value="text">Plain Text</option>
          </select>
        </div>
        
        {/* Clear Messages Button */}
        <button 
          className="px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded font-medium focus:outline-none focus:ring-2 focus:ring-red-500 md:col-span-3 xl:col-span-1" 
          onClick={handleClearMessages}
          disabled={isLoading || messages.length === 0}
          title="Clear all messages in the current conversation"
        >
          Clear Messages
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;