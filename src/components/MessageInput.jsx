import React from 'react';

const MessageInput = ({ onSendMessage, isLoading, apiKey }) => {
  const textareaRef = React.useRef(null);

  // Auto-focus the textarea when component mounts and when it becomes enabled
  React.useEffect(() => {
    if (textareaRef.current && !isLoading && apiKey) {
      textareaRef.current.focus();
    }
  }, [isLoading, apiKey]);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleInput = (e) => {
    adjustTextareaHeight();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const input = e.target.elements.messageInput;
    if (input.value.trim()) {
      onSendMessage(input.value);
      input.value = '';
      // Reset height after clearing
      input.style.height = 'auto';
      // Refocus after sending
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 10);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.target.value.trim()) {
        onSendMessage(e.target.value);
        e.target.value = '';
        // Reset height after clearing
        e.target.style.height = 'auto';
        // Refocus after sending
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 10);
      }
    }
  };

  // Default prompt buttons
  const defaultPrompts = [
    // "List your tools, their arguments in a markdown table",
    // "Add 3.14 and 2.86 using the local_add_numbers tool",
    // "Subtract 2.34 from 4.56 using the mcp_subtract_numbers tool",
    // "Multiply 1.5 and 3.7 using the sse_multiply_numbers tool",
    // "List the tables in the dolt database calvinw/BusMgmtBenchmarks/main",
    // "Give the first 5 rows in the company_info table in calvinw/BusMgmtBenchmarks/main",
    // "Describe the financials table in calvinw/BusMgmtBenchmarks/main",
    // "Give me 10 examples of LaTeX formulas",
    // "Explain conjoint analysis using formulas",
    // "Explain the ROA breakdown in the Strategic Profit Model",
    // "Explain multiple regression using formulas"
  ];

  const handlePromptClick = (prompt) => {
    onSendMessage(prompt);
  };

  return (
    <div className="p-4 bg-white flex-shrink-0">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center bg-gray-100 rounded-full border border-gray-200 p-2 gap-2">
          {/* Text input */}
          <textarea 
            ref={textareaRef}
            name="messageInput"
            className="flex-1 bg-transparent resize-none focus:outline-none placeholder-gray-500 py-2 px-4" 
            placeholder="Ask your question" 
            rows="1"
            disabled={isLoading || !apiKey}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            style={{ minHeight: '24px', lineHeight: '1.5', maxHeight: '200px' }}
            title="Type your message here"
          />

          {/* Send button */}
          <button 
            type="submit"
            className="p-2 bg-black text-white rounded-full hover:bg-gray-800 focus:outline-none transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={isLoading || !apiKey}
            title="Send message (or press Enter)"
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        </div>
      </form>
      
      {/* Default prompt buttons */}
      <div className="mt-3 flex flex-wrap gap-2">
        {defaultPrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => handlePromptClick(prompt)}
            disabled={isLoading || !apiKey}
            className="px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 hover:text-gray-900"
            title={prompt}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MessageInput;