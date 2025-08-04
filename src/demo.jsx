import React from 'react';
import ReactDOM from 'react-dom/client';
import LLMChatInterface from './LLMChatInterface.jsx';

const App = () => {

    // Define available tools
    const tools = [
        {
            type: "function",
            function: {
                name: "greet",
                description: "Generate a personalized greeting for someone",
                parameters: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "The name of the person to greet"
                        },
                        style: {
                            type: "string",
                            enum: ["casual", "formal", "funny"],
                            description: "The style of greeting (optional)",
                            default: "casual"
                        }
                    },
                    required: ["name"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "get_time",
                description: "Get the current time in a specific timezone",
                parameters: {
                    type: "object",
                    properties: {
                        timezone: {
                            type: "string",
                            description: "Timezone (e.g., 'America/New_York', 'Asia/Tokyo', 'UTC')",
                            default: "UTC"
                        }
                    }
                }
            }
        },
        {
            type: "function",
            function: {
                name: "calculate",
                description: "Perform a mathematical calculation",
                parameters: {
                    type: "object",
                    properties: {
                        expression: {
                            type: "string",
                            description: "Mathematical expression to evaluate (e.g., '2 + 3 * 4')"
                        }
                    },
                    required: ["expression"]
                }
            }
        }
    ];

    // Tool handler implementations
    const toolHandlers = {
        greet: ({ name, style = "casual" }) => {
            const greetings = {
                casual: `Hey there, ${name}! 👋 Hope you're having a great day!`,
                formal: `Good day, ${name}. It is a pleasure to make your acquaintance.`,
                funny: `Well well well, if it isn't ${name}! 🎭 Ready to chat with your favorite AI?`
            };
            
            return {
                greeting: greetings[style] || greetings.casual,
                name,
                style,
                timestamp: new Date().toISOString()
            };
        },

        get_time: ({ timezone = "UTC" }) => {
            try {
                const now = new Date();
                const timeString = now.toLocaleString("en-US", { 
                    timeZone: timezone,
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                
                return {
                    timezone,
                    current_time: timeString,
                    unix_timestamp: Math.floor(now.getTime() / 1000),
                    iso_string: now.toISOString()
                };
            } catch (error) {
                throw new Error(`Invalid timezone: ${timezone}`);
            }
        },

        calculate: ({ expression }) => {
            try {
                // Simple safe evaluation (only allow basic math operations)
                const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
                if (sanitized !== expression) {
                    throw new Error('Expression contains invalid characters');
                }
                
                const result = Function(`"use strict"; return (${sanitized})`)();
                
                if (typeof result !== 'number' || !isFinite(result)) {
                    throw new Error('Result is not a valid number');
                }
                
                return {
                    expression,
                    result,
                    type: typeof result
                };
            } catch (error) {
                throw new Error(`Calculation failed: ${error.message}`);
            }
        }
    };

    // Handle tool execution events
    const handleToolCall = (toolName, args, result, error) => {
        if (error) {
            console.log(`❌ ${toolName} failed: ${error.message}`);
        } else {
            console.log(`✅ ${toolName} succeeded`);
        }
    };

    // Handle message events
    const handleMessage = (userMessage, assistantResponse) => {
        console.log(`💬 User: "${userMessage.substring(0, 50)}..."`);
    };

    // Handle errors
    const handleError = (error) => {
        console.log(`🚨 Error: ${error.message}`);
    };

    
    return (
        <LLMChatInterface
            tools={tools}
            toolHandlers={toolHandlers}
            enableTools={true}
            toolChoice="auto"
            parallelToolCalls={true}
            onToolCall={handleToolCall}
            onMessage={handleMessage}
            onError={handleError}
            systemPrompt="You are a helpful AI assistant with access to several tools. Use the tools when appropriate to help users. You can greet people, tell time, and do calculations. Be friendly and explain what tools you're using."
            defaultModel="openai/gpt-4o-mini"
            height="600px"
        />
    );
};

const root = ReactDOM.createRoot(document.getElementById('chat-root'));
root.render(<App />);