import React from 'react';

// Collapsible Tool Call Component
const ToolCallSection = ({ toolCall, toolResult }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(true);
  
  let args = {};
  try {
    args = JSON.parse(toolCall.function.arguments);
  } catch (e) {
    args = { _raw: toolCall.function.arguments };
  }

  let result = {};
  try {
    result = JSON.parse(toolResult.content);
  } catch (e) {
    result = { _raw: toolResult.content };
  }

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 mb-2">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-100 rounded-lg transition-colors"
      >
        <div className="flex items-center space-x-2">
          <span className="font-mono font-semibold text-blue-800">
            {toolCall.function.name}()
          </span>
          <span className="text-xs text-gray-500">
            Tool executed
          </span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9l6 6 6-6" />
        </svg>
      </button>
      
      {!isCollapsed && (
        <div className="px-3 pb-3 border-t border-gray-200 mt-2 pt-2">
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Input:</div>
            <div className="bg-blue-50 p-2 rounded text-xs">
              <pre className="whitespace-pre-wrap">{JSON.stringify(args, null, 2)}</pre>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-semibold text-gray-600 mb-1">Output:</div>
            <div className="bg-green-50 p-2 rounded text-xs">
              <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Message = React.forwardRef(({ message, renderMessage, index, isStreaming, displayMode, messages = [] }, ref) => {
  // Handle different message types
  if (message.role === 'tool') {
    // Tool result messages are now handled within assistant messages, so we can hide standalone tool messages
    return null;
  }

  // Handle assistant messages with tool calls
  if (message.role === 'assistant' && message.tool_calls && message.tool_calls.length > 0) {
    // Find corresponding tool result messages
    const toolResults = [];
    message.tool_calls.forEach(toolCall => {
      // Look for tool result message with matching tool_call_id in the messages array
      const resultMessage = messages.find(msg => 
        msg.role === 'tool' && msg.tool_call_id === toolCall.id
      );
      if (resultMessage) {
        toolResults.push({ toolCall, toolResult: resultMessage });
      }
    });
    return (
      <div className="chat-message p-3 rounded border border-gray-200 border-l-4 border-l-green-400">
        <span className="font-semibold text-gray-800">AI:</span>
        
        {/* Regular content if present */}
        {message.content && message.content.trim() && (
          <div className="mt-1">
            <span 
              className="text-gray-700"
              dangerouslySetInnerHTML={{ 
                __html: renderMessage(message.content, message.role)
              }}
            />
          </div>
        )}
        
        {/* Collapsible tool sections */}
        {toolResults.length > 0 && (
          <div className="mt-3">
            {toolResults.map(({ toolCall, toolResult }, index) => (
              <ToolCallSection 
                key={toolCall.id || index}
                toolCall={toolCall}
                toolResult={toolResult}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Regular user/assistant messages
  const roleLabel = message.role === 'user' ? 'USER' : 'AI';
  const borderClass = message.role === 'user' ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-green-400';
  const isEmptyAI = message.role === 'assistant' && message.content.trim() === '';
  const streamingIndicator = (isStreaming && isEmptyAI) ? '<span class="streaming-indicator"></span>' : '';
  
  // Content classes - different for text vs markdown mode
  const contentClasses = displayMode === 'text' 
    ? 'text-gray-700 font-mono text-sm whitespace-pre-wrap'
    : 'text-gray-700';
  
  // For AI messages, we need a content ref for direct DOM manipulation during streaming
  const contentRef = React.useRef(null);
  
  // Expose content ref to parent for streaming updates
  React.useImperativeHandle(ref, () => ({
    updateContent: (content) => {
      if (contentRef.current) {
        contentRef.current.innerHTML = content;
        // Only trigger MathJax rendering in markdown mode
        if (displayMode === 'markdown' && window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise([contentRef.current])
            .catch(err => console.error('MathJax rendering failed:', err));
        }
      }
    },
    getContentElement: () => contentRef.current
  }), [displayMode]);
  
  return (
    <div className={`chat-message p-3 rounded border border-gray-200 ${borderClass}`}>
      <span className="font-semibold text-gray-800">{roleLabel}:</span>{' '}
      <span 
        ref={contentRef}
        className={contentClasses}
        dangerouslySetInnerHTML={{ 
          __html: renderMessage(message.content, message.role) + streamingIndicator
        }}
      />
    </div>
  );
});

Message.displayName = 'Message';

export default Message;