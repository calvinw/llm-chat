import React from 'react';

const Message = React.forwardRef(({ message, renderMessage, index, isStreaming, displayMode }, ref) => {
  const roleLabel = message.role === 'user' ? 'USER' : 'AI';
  const borderClass = message.role === 'user' ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-green-400';
  const isEmptyAI = message.role === 'assistant' && message.content.trim() === '';
  const streamingIndicator = (isStreaming && isEmptyAI) ? '<span class="streaming-indicator"></span>' : '';
  
  // Content classes - different for text vs markdown mode (matches vanilla JS)
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
        // Only trigger MathJax rendering in markdown mode (not in plain text mode)
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