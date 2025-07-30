import React from 'react';
/**
 * Simplified chat engine hook - NO STREAMING
 * Manages messages and API communication with simple request/response
 */

import { OpenRouterClient } from '../utils/apiClient.js';
import { DEFAULT_SYSTEM_PROMPT, MESSAGE_ROLES } from '../utils/constants.js';

const useChatEngine = (apiKey, defaultModel, systemPrompt = DEFAULT_SYSTEM_PROMPT) => {
  // State management
  const [messages, setMessages] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentModel, setCurrentModel] = React.useState(defaultModel);
  const [error, setError] = React.useState(null);
  const [isStreaming, setIsStreaming] = React.useState(false);

  // API client instance
  const apiClient = React.useMemo(() => {
    return apiKey ? new OpenRouterClient(apiKey) : null;
  }, [apiKey]);

  // Ref for streaming callbacks to access latest state
  const streamingCallbacksRef = React.useRef({});

  // Generate unique message ID
  const generateMessageId = () => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add a new message
  const addMessage = (role, content) => {
    const newMessage = {
      id: generateMessageId(),
      role,
      content,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  // Register streaming callbacks (used by components for direct DOM manipulation)
  const registerStreamingCallbacks = React.useCallback((callbacks) => {
    streamingCallbacksRef.current = callbacks;
  }, []);

  // Send a message and get AI response (matches vanilla JS implementation)
  const sendMessage = async (userMessage) => {
    if (!apiClient) {
      throw new Error('API key is required');
    }

    if (!userMessage.trim()) {
      throw new Error('Message cannot be empty');
    }

    if (isLoading || isStreaming) {
      throw new Error('Already processing a message');
    }

    setError(null);
    setIsLoading(true);

    // Add user message
    const userMsg = addMessage(MESSAGE_ROLES.USER, userMessage.trim());
    
    // Add placeholder AI message for streaming updates (matches vanilla JS)
    const aiMsg = addMessage(MESSAGE_ROLES.ASSISTANT, '');
    const aiMessageIndex = messages.length + 1; // +1 because we just added user message

    try {
      // Prepare messages for API (include system message, exclude empty AI message)
      const apiMessages = [
        { role: MESSAGE_ROLES.SYSTEM, content: systemPrompt },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: MESSAGE_ROLES.USER, content: userMessage.trim() }
      ];

      setIsStreaming(true);
      setIsLoading(false);

      // Try streaming first (matches vanilla JS approach)
      await apiClient.streamCompletion(
        apiMessages,
        currentModel,
        // onChunk callback - updates DOM directly like vanilla JS
        (accumulatedContent) => {
          if (streamingCallbacksRef.current.onChunk) {
            streamingCallbacksRef.current.onChunk(accumulatedContent);
          }
        },
        // onComplete callback - updates React state when done
        (finalContent) => {
          setIsStreaming(false);
          // Update React state with final content
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (newMessages[lastIndex] && newMessages[lastIndex].role === MESSAGE_ROLES.ASSISTANT) {
              newMessages[lastIndex] = { ...newMessages[lastIndex], content: finalContent };
            }
            return newMessages;
          });
          if (streamingCallbacksRef.current.onComplete) {
            streamingCallbacksRef.current.onComplete(finalContent);
          }
        },
        // onError callback - fall back to non-streaming
        async (streamingError) => {
          console.error('Streaming failed, falling back to non-streaming:', streamingError.message);
          setIsStreaming(false);
          setIsLoading(true);
          
          try {
            // Fallback to non-streaming API call (matches vanilla JS)
            const response = await apiClient.getCompletion(apiMessages, currentModel);
            
            // Update React state with response
            setMessages(prev => {
              const newMessages = [...prev];
              const lastIndex = newMessages.length - 1;
              if (newMessages[lastIndex] && newMessages[lastIndex].role === MESSAGE_ROLES.ASSISTANT) {
                newMessages[lastIndex] = { ...newMessages[lastIndex], content: response };
              }
              return newMessages;
            });
            
            setIsLoading(false);
            
            if (streamingCallbacksRef.current.onComplete) {
              streamingCallbacksRef.current.onComplete(response);
            }
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError.message);
            const errorMessage = `Error: ${fallbackError.message}`;
            
            // Update React state with error
            setMessages(prev => {
              const newMessages = [...prev];
              const lastIndex = newMessages.length - 1;
              if (newMessages[lastIndex] && newMessages[lastIndex].role === MESSAGE_ROLES.ASSISTANT) {
                newMessages[lastIndex] = { ...newMessages[lastIndex], content: errorMessage };
              }
              return newMessages;
            });
            
            setError(fallbackError);
            setIsLoading(false);
            throw fallbackError;
          }
        }
      );

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error);
      setIsLoading(false);
      setIsStreaming(false);
      throw error;
    }
  };

  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    isLoading,
    isStreaming,
    currentModel,
    error,
    sendMessage,
    clearMessages,
    setCurrentModel,
    registerStreamingCallbacks,
    hasMessages: messages.length > 0
  };
};

export default useChatEngine;