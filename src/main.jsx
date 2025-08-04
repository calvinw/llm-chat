import React from 'react';
import ReactDOM from 'react-dom/client';
import LLMChatInterface from './LLMChatInterface.jsx';

function App() {
    // Tool logging function
    const logTool = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
    };

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
        }
    };

    // Handle tool execution events
    const handleToolCall = (toolName, args, result, error) => {
        if (error) {
            console.log(`❌ ${toolName} failed: ${error.message}`);
        } else {
            console.log(`✅ ${toolName} succeeded:`, result);
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
            systemPrompt=""
            defaultModel="openai/gpt-4o-mini"
            height="100vh"
        />
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
