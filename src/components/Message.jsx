import React from 'react';

const Message = React.forwardRef(({ message, renderMessage, index, isStreaming, displayMode, messages = [], tools = [] }, ref) => {
  // Handle different message types
  if (message.role === 'tool') {
    // Tool result messages are now handled as separate tool_execution messages
    return null;
  }

  // Handle tool execution messages
  if (message.role === 'tool_execution' && message.toolExecution) {
    const { toolCall, toolResult } = message.toolExecution;
    const [isCollapsed, setIsCollapsed] = React.useState(true);
    
    return (
      <div className="chat-message rounded border border-gray-200 border-l-4 border-l-purple-400 bg-purple-50">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full p-3 text-left flex items-center justify-between hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-purple-800">🔧 Tool:</span>
            <span className="font-mono font-semibold text-purple-800">
              {toolCall.name}({(() => {
                // Find the tool definition to get the correct parameter order
                const toolDef = tools?.find(t => t.function?.name === toolCall.name);
                const properties = toolDef?.function?.parameters?.properties;
                const required = toolDef?.function?.parameters?.required || [];
                
                if (!properties) {
                  // Fallback to object order if no tool definition found
                  return Object.entries(toolCall.arguments).map(([key, value]) => 
                    `${key}=${typeof value === 'string' ? `"${value}"` : value}`
                  ).join(', ');
                }
                
                // Get property keys in definition order (required first, then others)
                const propertyKeys = Object.keys(properties);
                const requiredKeys = required.filter(key => key in toolCall.arguments);
                const optionalKeys = propertyKeys
                  .filter(key => !required.includes(key) && key in toolCall.arguments)
                  .sort(); // Sort optional keys alphabetically
                
                const orderedKeys = [...requiredKeys, ...optionalKeys];
                
                return orderedKeys.map(key => {
                  const value = toolCall.arguments[key];
                  return `${key}=${typeof value === 'string' ? `"${value}"` : value}`;
                }).join(', ');
              })()})
            </span>
            <span className="text-xs text-purple-600">
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
          <div className="px-3 pb-3 border-t border-purple-200 space-y-3 text-sm">
            {/* Input section */}
            <div>
              <div className="text-xs font-semibold text-purple-700 mb-1">Input:</div>
              <div className="bg-blue-50 p-2 rounded border">
                <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(toolCall.arguments, null, 2)}</pre>
              </div>
            </div>
            
            {/* Output section */}
            <div>
              <div className="text-xs font-semibold text-purple-700 mb-1">Output:</div>
              <div className="bg-green-50 p-2 rounded border">
                <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(toolResult, null, 2)}</pre>
              </div>
            </div>
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
  
  React.useEffect(() => {
    if (displayMode === 'markdown' && window.MathJax && window.MathJax.typesetPromise) {
      const timer = setTimeout(() => {
        if (contentRef.current) {
          window.MathJax.typesetPromise([contentRef.current])
            .catch(err => console.error('MathJax rendering failed:', err));
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [message.content, displayMode]);

  // Return the JSX for regular messages
  return (
    <div className={`chat-message p-3 rounded border border-gray-200 ${borderClass}`}>
      <span className="font-semibold text-gray-800">{roleLabel}:</span>{' '}
      <span 
        className={contentClasses}
        ref={contentRef}
        dangerouslySetInnerHTML={{ 
          __html: renderMessage(message.content, message.role) + streamingIndicator 
        }}
      />
    </div>
  );
});

Message.displayName = 'Message';

export default Message;