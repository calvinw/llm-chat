import React from 'react';
/**
 * Chat engine hook with tool calling support
 * Manages messages, API communication, and tool execution
 */

import { OpenRouterClient } from '../utils/apiClient.js';
import { DEFAULT_SYSTEM_PROMPT, MESSAGE_ROLES } from '../utils/constants.js';
import useToolManager from './useToolManager.js';

const useChatEngine = (apiKey, defaultModel, systemPrompt = DEFAULT_SYSTEM_PROMPT, tools = null, toolHandlers = null, toolChoice = "auto", parallelToolCalls = true, onToolCall = null) => {
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

  // Tool manager for executing tools
  const { executeTools } = useToolManager(toolHandlers, onToolCall);

  // Ref for streaming callbacks to access latest state
  const streamingCallbacksRef = React.useRef({});

  // Generate unique message ID
  const generateMessageId = () => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add a new message with optional tool calls or tool execution data
  const addMessage = (role, content, toolCalls = null, toolCallId = null, toolExecution = null) => {
    const newMessage = {
      id: generateMessageId(),
      role,
      content,
      timestamp: Date.now(),
      ...(toolCalls && { tool_calls: toolCalls }),
      ...(toolCallId && { tool_call_id: toolCallId }),
      ...(toolExecution && { toolExecution })
    };

    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  // Register streaming callbacks (used by components for direct DOM manipulation)
  const registerStreamingCallbacks = React.useCallback((callbacks) => {
    streamingCallbacksRef.current = callbacks;
  }, []);

  // Continue conversation with tool results (internal helper)
  const continueConversationWithTools = async (toolResults, currentApiMessages) => {
    try {
      // Tool execution messages are already created in handleToolCallsInResponse
      // No need to add tool result messages here

      // Prepare API messages by extending the current conversation
      const apiMessages = [
        ...currentApiMessages,
        ...toolResults.map(result => ({
          role: MESSAGE_ROLES.TOOL,
          content: result.content,
          tool_call_id: result.tool_call_id
        }))
      ];

      // Add placeholder for new AI response
      const aiMsg = addMessage(MESSAGE_ROLES.ASSISTANT, '');

      setIsStreaming(true);

      // Continue conversation with tool results
      await apiClient.streamCompletion(
        apiMessages,
        currentModel,
        tools,
        toolChoice,
        parallelToolCalls,
        // onChunk callback
        (accumulatedContent) => {
          if (streamingCallbacksRef.current.onChunk) {
            streamingCallbacksRef.current.onChunk(accumulatedContent);
          }
        },
        // onToolCall callback - handle nested tool calls
        async (toolCalls, accumulatedContent = '') => {
          console.log('Tool calls detected in streaming:', toolCalls);
          
          // Update the current AI message with content (no tool_calls)
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (newMessages[lastIndex] && newMessages[lastIndex].role === MESSAGE_ROLES.ASSISTANT) {
              newMessages[lastIndex] = { 
                ...newMessages[lastIndex], 
                content: accumulatedContent
              };
            }
            return newMessages;
          });

          const nestedResults = await executeTools(toolCalls);
          
          // Create separate tool execution messages
          toolCalls.forEach((toolCall, index) => {
            const toolResult = nestedResults[index];
            
            // Parse arguments to show resolved values (including defaults)
            let resolvedArgs = {};
            try {
              resolvedArgs = JSON.parse(toolCall.function.arguments);
            } catch (e) {
              resolvedArgs = { _raw: toolCall.function.arguments };
            }
            
            // Parse tool result
            let parsedResult = {};
            try {
              parsedResult = JSON.parse(toolResult.content);
            } catch (e) {
              parsedResult = { _raw: toolResult.content };
            }
            
            // Add tool execution message
            console.log('Creating tool execution message from streaming:', {
              role: MESSAGE_ROLES.TOOL_EXECUTION,
              toolCall: {
                name: toolCall.function.name,
                arguments: resolvedArgs
              },
              toolResult: parsedResult
            });
            
            addMessage(MESSAGE_ROLES.TOOL_EXECUTION, '', null, null, {
              toolCall: {
                name: toolCall.function.name,
                arguments: resolvedArgs
              },
              toolResult: parsedResult
            });
          });
          
          // For nested calls, we need to build the correct message sequence
          const apiMessagesWithToolCall = [
            ...apiMessages,
            { role: MESSAGE_ROLES.ASSISTANT, content: accumulatedContent, tool_calls: toolCalls }
          ];
          
          await continueConversationWithTools(nestedResults, apiMessagesWithToolCall);
        },
        // onComplete callback
        (finalContent, toolCalls) => {
          setIsStreaming(false);
          setIsLoading(false);

          if (toolCalls && toolCalls.length > 0) {
            // Handle tool calls in the response
            handleToolCallsInResponse(finalContent, toolCalls);
          } else {
            // Regular text response - update final message
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
          }
        },
        // onError callback
        async (streamingError) => {
          console.error('Tool continuation streaming failed:', streamingError);
          await handleStreamingError(streamingError, apiMessages);
        }
      );

    } catch (error) {
      console.error('Error continuing conversation with tools:', error);
      setError(error);
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // Handle tool calls in response (internal helper)
  const handleToolCallsInResponse = async (content, toolCalls) => {
    try {
      // Update the current AI message with content, or remove if empty
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        
        if (newMessages[lastIndex] && newMessages[lastIndex].role === MESSAGE_ROLES.ASSISTANT) {
          if (content && content.trim()) {
            // Update with meaningful content
            newMessages[lastIndex] = { 
              ...newMessages[lastIndex], 
              content
            };
          } else {
            // Remove empty AI message
            newMessages.splice(lastIndex, 1);
          }
        }
        return newMessages;
      });

      // Execute tools
      const toolResults = await executeTools(toolCalls);
      
      // Create separate tool execution messages
      toolCalls.forEach((toolCall, index) => {
        const toolResult = toolResults[index];
        
        // Parse arguments to show resolved values (including defaults)
        let resolvedArgs = {};
        try {
          resolvedArgs = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          resolvedArgs = { _raw: toolCall.function.arguments };
        }
        
        // Parse tool result
        let parsedResult = {};
        try {
          parsedResult = JSON.parse(toolResult.content);
        } catch (e) {
          parsedResult = { _raw: toolResult.content };
        }
        
        // Add tool execution message
        console.log('Creating tool execution message:', {
          role: MESSAGE_ROLES.TOOL_EXECUTION,
          toolCall: {
            name: toolCall.function.name,
            arguments: resolvedArgs
          },
          toolResult: parsedResult
        });
        
        addMessage(MESSAGE_ROLES.TOOL_EXECUTION, '', null, null, {
          toolCall: {
            name: toolCall.function.name,
            arguments: resolvedArgs
          },
          toolResult: parsedResult
        });
      });
      
      // Continue conversation with tool results
      // We need to reconstruct the API messages up to this point
      const currentApiMessages = [
        { role: MESSAGE_ROLES.SYSTEM, content: systemPrompt },
        ...messages
          .filter(msg => msg.role !== MESSAGE_ROLES.TOOL_EXECUTION) // Filter out display-only tool execution messages
          .map(msg => {
            const message = { role: msg.role, content: msg.content };
            if (msg.tool_calls) message.tool_calls = msg.tool_calls;
            if (msg.tool_call_id) message.tool_call_id = msg.tool_call_id;
            return message;
          }),
        { role: MESSAGE_ROLES.ASSISTANT, content, tool_calls: toolCalls }
      ];
      
      await continueConversationWithTools(toolResults, currentApiMessages);

    } catch (error) {
      console.error('Error handling tool calls:', error);
      setError(error);
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // Handle streaming errors (internal helper)
  const handleStreamingError = async (streamingError, apiMessages) => {
    console.error('Streaming failed, falling back to non-streaming:', streamingError.message);
    setIsStreaming(false);
    setIsLoading(true);
    
    try {
      // Fallback to non-streaming API call
      const response = await apiClient.getCompletion(apiMessages, currentModel, tools, toolChoice, parallelToolCalls);
      
      if (response.tool_calls && response.tool_calls.length > 0) {
        // Handle tool calls in non-streaming response
        await handleToolCallsInResponse(response.content, response.tool_calls);
      } else {
        // Regular text response
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          if (newMessages[lastIndex] && newMessages[lastIndex].role === MESSAGE_ROLES.ASSISTANT) {
            newMessages[lastIndex] = { ...newMessages[lastIndex], content: response.content };
          }
          return newMessages;
        });
        
        setIsLoading(false);
        
        if (streamingCallbacksRef.current.onComplete) {
          streamingCallbacksRef.current.onComplete(response.content);
        }
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError.message);
      const errorMessage = `Error: ${fallbackError.message}`;
      
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
  };

  // Send a message and get AI response with tool support
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
    
    // Add placeholder AI message for streaming updates
    const aiMsg = addMessage(MESSAGE_ROLES.ASSISTANT, '');

    try {
      // Prepare messages for API (include system message and conversation history)
      const apiMessages = [
        { role: MESSAGE_ROLES.SYSTEM, content: systemPrompt },
        ...messages
          .filter(msg => msg.role !== MESSAGE_ROLES.TOOL_EXECUTION) // Filter out display-only tool execution messages
          .map(msg => {
            const message = { role: msg.role, content: msg.content };
            if (msg.tool_calls) message.tool_calls = msg.tool_calls;
            if (msg.tool_call_id) message.tool_call_id = msg.tool_call_id;
            return message;
          }),
        { role: MESSAGE_ROLES.USER, content: userMessage.trim() }
      ];

      setIsStreaming(true);
      setIsLoading(false);

      // Start streaming with tool support
      await apiClient.streamCompletion(
        apiMessages,
        currentModel,
        tools,
        toolChoice,
        parallelToolCalls,
        // onChunk callback - updates DOM directly
        (accumulatedContent) => {
          if (streamingCallbacksRef.current.onChunk) {
            streamingCallbacksRef.current.onChunk(accumulatedContent);
          }
        },
        // onToolCall callback - handle tool calls during streaming
        async (toolCalls, accumulatedContent = '') => {
          console.log('Tool calls detected:', toolCalls);
          
          // If there's meaningful content, update the assistant message, otherwise remove it
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            
            if (newMessages[lastIndex] && newMessages[lastIndex].role === MESSAGE_ROLES.ASSISTANT) {
              if (accumulatedContent && accumulatedContent.trim()) {
                // Update with content
                newMessages[lastIndex] = { 
                  ...newMessages[lastIndex], 
                  content: accumulatedContent
                };
              } else {
                // Remove empty AI message
                newMessages.splice(lastIndex, 1);
              }
            }
            return newMessages;
          });

          // Execute tools
          const toolResults = await executeTools(toolCalls);
          
          // Create separate tool execution messages
          toolCalls.forEach((toolCall, index) => {
            const toolResult = toolResults[index];
            
            // Parse arguments to show resolved values (including defaults)
            let resolvedArgs = {};
            try {
              resolvedArgs = JSON.parse(toolCall.function.arguments);
            } catch (e) {
              resolvedArgs = { _raw: toolCall.function.arguments };
            }
            
            // Parse tool result
            let parsedResult = {};
            try {
              parsedResult = JSON.parse(toolResult.content);
            } catch (e) {
              parsedResult = { _raw: toolResult.content };
            }
            
            console.log('Creating tool execution message:', {
              role: MESSAGE_ROLES.TOOL_EXECUTION,
              toolCall: {
                name: toolCall.function.name,
                arguments: resolvedArgs
              },
              toolResult: parsedResult
            });
            
            addMessage(MESSAGE_ROLES.TOOL_EXECUTION, '', null, null, {
              toolCall: {
                name: toolCall.function.name,
                arguments: resolvedArgs
              },
              toolResult: parsedResult
            });
          });
          
          // Build the correct API message sequence
          const apiMessagesWithToolCall = [
            ...apiMessages,
            { role: MESSAGE_ROLES.ASSISTANT, content: accumulatedContent, tool_calls: toolCalls }
          ];
          
          await continueConversationWithTools(toolResults, apiMessagesWithToolCall);
        },
        // onComplete callback - handle final response
        (finalContent, toolCalls) => {
          console.log('onComplete called with:', { finalContent, toolCalls: toolCalls?.length || 0 });
          setIsStreaming(false);
          setIsLoading(false);

          if (toolCalls && toolCalls.length > 0) {
            // Handle tool calls in the response
            console.log('Handling tool calls in onComplete');
            handleToolCallsInResponse(finalContent, toolCalls);
          } else {
            // Regular text response - update final message
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
          }
        },
        // onError callback - fall back to non-streaming
        async (streamingError) => {
          await handleStreamingError(streamingError, apiMessages);
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