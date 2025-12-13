import React, { useRef, useEffect } from 'react';
import Message from './Message.jsx';

const MessagesContainer = ({ 
  messages, 
  isLoading, 
  isStreaming, 
  renderMessage, 
  messagesEndRef,
  registerStreamingCallbacks,
  displayMode,
  tools
}) => {
  // Refs for each message (to enable direct DOM updates during streaming)
  const messageRefs = useRef([]);
  
  // Update refs array when messages change
  useEffect(() => {
    messageRefs.current = messageRefs.current.slice(0, messages.length);
  }, [messages.length]);

  // Set up streaming callbacks (matches vanilla JS updateLastMessage function)
  useEffect(() => {
    if (registerStreamingCallbacks) {
      registerStreamingCallbacks({
        onChunk: (accumulatedContent) => {
          // Find the last AI message and update its content directly (like vanilla JS)
          const lastMessageIndex = messages.length - 1;
          const lastMessage = messages[lastMessageIndex];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            const messageRef = messageRefs.current[lastMessageIndex];
            if (messageRef && messageRef.updateContent) {
              // Process content with markdown like vanilla JS
              const processedContent = renderMessage(accumulatedContent, 'assistant');
              const streamingIndicator = accumulatedContent.trim() === '' ? 
                '<span class="streaming-indicator"></span>' : '';
              messageRef.updateContent(processedContent + streamingIndicator);
              
              // Auto-scroll during streaming (matches vanilla JS behavior)
              if (messagesEndRef && messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }
        },
        onComplete: (finalContent) => {
          // Final update when streaming completes
          const lastMessageIndex = messages.length - 1;
          const lastMessage = messages[lastMessageIndex];
          
          if (lastMessage && lastMessage.role === 'assistant') {
            const messageRef = messageRefs.current[lastMessageIndex];
            if (messageRef && messageRef.updateContent) {
              const processedContent = renderMessage(finalContent, 'assistant');
              messageRef.updateContent(processedContent);
              
              // Final scroll when streaming completes
              if (messagesEndRef && messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }
        }
      });
    }
  }, [messages, renderMessage, registerStreamingCallbacks, messagesEndRef, displayMode]);

  return (
    <div className="flex-1 overflow-y-auto p-4 min-h-0 flex flex-col">
      <div className="flex-1">
        <div className="space-y-2">
          {messages.map((message, index) => (
            <Message 
              key={message.id || index}
              ref={el => messageRefs.current[index] = el}
              message={message}
              messages={messages}
              renderMessage={renderMessage}
              index={index}
              isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
              displayMode={displayMode}
              tools={tools}
            />
          ))}
          
          {/* Loading indicator for non-streaming requests */}
          {isLoading && !isStreaming && (
            <div className="chat-message p-3 rounded border border-gray-200 border-l-4 border-l-green-400">
              <span className="font-semibold text-gray-800">AI:</span>{' '}
              <span className="text-gray-500 italic">Thinking...</span>
            </div>
          )}
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default MessagesContainer;