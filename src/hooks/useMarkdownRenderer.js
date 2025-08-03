import React from 'react';
/**
 * Custom hook for rendering markdown content with math support
 * Handles both markdown and plain text display modes
 */

import { 
  preprocessMarkdownForMath, 
  renderPlainText,
  createMarkdownRenderer 
} from '../utils/mathProcessor.js';

const useMarkdownRenderer = (displayMode = 'markdown') => {
  // Create markdown renderer instance (memoized)
  const markdownRenderer = React.useMemo(() => {
    return createMarkdownRenderer();
  }, []);

  // Memoized function to render message content
  const renderMessage = React.useCallback((content, role = 'assistant') => {
    if (!content) return '';

    if (displayMode === 'text') {
      // Plain text mode - just escape HTML and convert line breaks
      return renderPlainText(content);
    }

    // Markdown mode with math support
    try {
      // Step 1: Preprocess to protect math expressions
      const { content: processedContent, restoreMath } = preprocessMarkdownForMath(content);
      
      // Step 2: Render markdown to HTML
      const htmlContent = markdownRenderer.render(processedContent);
      
      // Step 3: Restore math expressions
      const finalContent = restoreMath(htmlContent);
      
      return finalContent;
    } catch (error) {
      console.error('Error rendering markdown for content:', content.substring(0, 100) + '...');
      console.error('Markdown error details:', error);
      console.error('Error stack:', error.stack);
      
      // Try to render without math processing as a fallback
      try {
        console.warn('Attempting fallback: rendering without math processing...');
        const htmlContent = markdownRenderer.render(content);
        return htmlContent;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        // Final fallback to plain text
        return renderPlainText(content);
      }
    }
  }, [displayMode, markdownRenderer]);



  return {
    renderMessage,
    displayMode
  };
};

export default useMarkdownRenderer;