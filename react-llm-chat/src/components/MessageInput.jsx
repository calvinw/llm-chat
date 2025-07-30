import React from 'react';

const MessageInput = ({ onSendMessage, isLoading, apiKey }) => {
  return (
    <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
      <form onSubmit={(e) => {
        e.preventDefault();
        const input = e.target.elements.messageInput;
        onSendMessage(input.value);
        input.value = '';
      }} className="flex gap-2">
        <textarea 
          name="messageInput"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          placeholder="Type your message... (supports Markdown and LaTeX math)" 
          rows="1"
          disabled={isLoading || !apiKey}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSendMessage(e.target.value);
              e.target.value = '';
            }
          }}
          title="Type your message here. Use ** for bold, * for italic, $...$ for math, $$...$$ for display math"
        />
        
        <button 
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0" 
          disabled={isLoading || !apiKey}
          title="Send message (or press Enter)"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;