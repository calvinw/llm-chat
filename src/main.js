import { render } from 'https://esm.sh/preact@10.19.3';
import { html } from './utils/html.js';
import LLMChatInterface from './LLMChatInterface.js';

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
                name: "local_add_numbers",
                description: "Add two numbers together",
                parameters: {
                    type: "object",
                    properties: {
                        a: {
                            type: "number",
                            description: "First number to add"
                        },
                        b: {
                            type: "number",
                            description: "Second number to add"
                        }
                    },
                    required: ["a", "b"]
                }
            }
        }
    ];

    // Tool handler implementations
    const toolHandlers = {
        local_add_numbers: ({ a, b }) => {
            const result = a + b;
            return {
                a: a,
                b: b,
                result: result,
                operation: 'addition'
            };
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

    return html`
        <${LLMChatInterface}
            tools=${tools}
            toolHandlers=${toolHandlers}
            enableTools=${true}
            toolChoice="auto"
            parallelToolCalls=${true}
            onToolCall=${handleToolCall}
            onMessage=${handleMessage}
            onError=${handleError}
            systemPrompt=""
            defaultModel="openai/gpt-4o-mini"
            height="100vh"
        />
    `;
}

render(html`<${App} />`, document.getElementById('root'));
