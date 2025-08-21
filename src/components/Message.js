import { html } from '../utils/html.js';
import { useState, useRef, useImperativeHandle, useEffect } from 'https://esm.sh/preact@10.19.3/hooks';
import { forwardRef } from 'https://esm.sh/preact@10.19.3/compat';

const Message = forwardRef(({ message, renderMessage, index, isStreaming, displayMode, messages = [], tools = [] }, ref) => {
  // Handle different message types
  if (message.role === 'tool') {
    // Tool result messages are now handled as separate tool_execution messages
    return null;
  }

  // Handle tool execution messages
  if (message.role === 'tool_execution' && message.toolExecution) {
    const { toolCall, toolResult } = message.toolExecution;
    const [isCollapsed, setIsCollapsed] = useState(true);
    
    return html`
      <div className="chat-message rounded border border-gray-200 border-l-4 border-l-purple-400 bg-purple-50">
        <button
          onClick=${() => setIsCollapsed(!isCollapsed)}
          className="w-full p-3 text-left flex items-center justify-between hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-purple-800">🔧 Tool:</span>
            <span className="font-mono font-semibold text-purple-800">
              ${toolCall.name}(${(() => {
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
                
                // Combine actual arguments with defaults from schema
                const displayArgs = { ...toolCall.arguments };
                
                // Add defaults for missing optional parameters
                propertyKeys.forEach(key => {
                  if (!(key in displayArgs) && properties[key]?.default !== undefined) {
                    displayArgs[key] = properties[key].default;
                  }
                });
                
                const requiredKeys = required.filter(key => key in displayArgs);
                const optionalKeys = propertyKeys
                  .filter(key => !required.includes(key) && key in displayArgs)
                  .sort(); // Sort optional keys alphabetically
                
                const orderedKeys = [...requiredKeys, ...optionalKeys];
                
                return orderedKeys.map(key => {
                  const value = displayArgs[key];
                  return `${key}=${typeof value === 'string' ? `"${value}"` : value}`;
                }).join(', ');
              })()})
            </span>
            <span className="text-xs text-purple-600">
              Tool executed
            </span>
          </div>
          <svg
            className=${`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth=${2} d="M6 9l6 6 6-6" />
          </svg>
        </button>
        
        ${!isCollapsed && html`
          <div className="px-3 pb-3 border-t border-purple-200 space-y-3 text-sm">
            <!-- Input section -->
            <div>
              <div className="text-xs font-semibold text-purple-700 mb-1">Input:</div>
              <div className="bg-blue-50 p-2 rounded border">
                <pre className="whitespace-pre-wrap text-xs">${JSON.stringify((() => {
                  const toolDef = tools?.find(t => t.function?.name === toolCall.name);
                  const properties = toolDef?.function?.parameters?.properties;
                  
                  if (!properties) return toolCall.arguments;
                  
                  // Combine actual arguments with defaults from schema
                  const displayArgs = { ...toolCall.arguments };
                  
                  // Add defaults for missing optional parameters
                  Object.keys(properties).forEach(key => {
                    if (!(key in displayArgs) && properties[key]?.default !== undefined) {
                      displayArgs[key] = properties[key].default;
                    }
                  });
                  
                  return displayArgs;
                })(), null, 2)}</pre>
              </div>
            </div>
            
            <!-- Output section -->
            <div>
              <div className="text-xs font-semibold text-purple-700 mb-1">Output:</div>
              <div className="bg-green-50 p-2 rounded border">
                <pre className="whitespace-pre-wrap text-xs">${JSON.stringify(toolResult, null, 2)}</pre>
              </div>
            </div>
          </div>
        `}
      </div>
    `;
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
  const contentRef = useRef(null);
  
  // Expose content ref to parent for streaming updates
  useImperativeHandle(ref, () => ({
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
  
  useEffect(() => {
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

  // Return the htm template for regular messages
  return html`
    <div className=${`chat-message p-3 rounded border border-gray-200 ${borderClass}`}>
      <span className="font-semibold text-gray-800">${roleLabel}:</span> <span 
        className=${contentClasses}
        ref=${contentRef}
        innerHTML=${renderMessage(message.content, message.role) + streamingIndicator}
      ></span>
    </div>
  `;
});

Message.displayName = 'Message';

export default Message;