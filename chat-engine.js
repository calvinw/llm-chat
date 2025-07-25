// Helper functions
const getNestedProperty = (obj, path) => {
    if (typeof path !== 'string') path = String(path);
    return path.split('.').reduce((acc, key) => acc && acc[key], obj);
};

class Store {
    constructor(options = {}) {
        this.state = options.state || {};
        this.mutations = options.mutations || {};
        this.subscribers = [];
    }

    commit(mutation, payload) {
        if (!this.mutations[mutation]) {
            console.error(`Mutation ${mutation} does not exist`);
            return;
        }
        
        const prevState = JSON.parse(JSON.stringify(this.state));
        this.mutations[mutation](this.state, payload);
        this.notifySubscribers(prevState);
    }

    subscribe(path, fn) {
        this.subscribers.push({ path, fn });
        // Immediately call with current value
        const currentValue = getNestedProperty(this.state, path);
        fn(currentValue, undefined);
    }

    notifySubscribers(prevState) {
        this.subscribers.forEach(({ path, fn }) => {
            const newValue = getNestedProperty(this.state, path);
            const prevValue = getNestedProperty(prevState, path);
            if (JSON.stringify(newValue) !== JSON.stringify(prevValue)) {
                fn(newValue, prevValue);
            }
        });
    }
}

class ChatEngine {
    constructor(config) {
        if (!config.apiKey) throw new Error('API key is required');
        if (!config.model) throw new Error('Model name is required');

        this.apiKey = config.apiKey;
        this.model = config.model;
        this.setupStore(config.systemPrompt);
    }

    setupStore(systemPrompt) {
        this.store = new Store({
            state: {
                model: "openai/gpt-4o-mini",
                messages: [{
                    role: 'system',
                    content: systemPrompt || 'You are a helpful AI assistant.'
                }]
            },
            mutations: {
                setModel: (state, model) => {
                    state.model = model;
                },
                setSystemMessage: (state, message) => {
                    state.messages[0].content = message;
                },
                addMessage: (state, message) => {
                    state.messages.push(message);
                },
                clearMessages: (state) => {
                    state.messages = [{
                        role: 'system',
                        content: state.messages[0].content
                    }];
                },
                updateMessage: (state, { index, content }) => {
                    if (state.messages[index]) {
                        state.messages[index].content = content;
                    }
                }
            }
        });
    }

    async sendMessage(userMessage) {
        this.store.commit('addMessage', {
            role: "user",
            content: userMessage
        });

        // Add placeholder AI message for streaming
        const aiMessageIndex = this.store.state.messages.length;
        this.store.commit('addMessage', {
            role: 'assistant',
            content: ''
        });

        try {
            await this.makeStreamingApiRequest(aiMessageIndex);
        } catch (error) {
            console.error('Streaming failed, falling back to non-streaming:', error.message);
            // Fallback to non-streaming
            try {
                const response = await this.makeApiRequest();
                const aiMessage = response.choices[0].message.content;
                this.store.commit('updateMessage', {
                    index: aiMessageIndex,
                    content: aiMessage
                });
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError.message);
                this.store.commit('updateMessage', {
                    index: aiMessageIndex,
                    content: `Error: ${fallbackError.message}`
                });
                throw fallbackError;
            }
        }
    }

    async makeStreamingApiRequest(aiMessageIndex) {
        // console.log('Starting streaming request...');
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Chat App'
            },
            body: JSON.stringify({
                model: this.store.state.model,
                messages: this.getMessages().slice(0, -1), // Exclude the empty AI message we just added
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // console.log('Response received, starting stream...');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let updateCount = 0;

        // Update every few chunks to balance smoothness and performance
        const shouldUpdate = () => {
            updateCount++;
            return updateCount % 6 === 0; // Update every 6th chunk
        };

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    // Final update to ensure all content is displayed
                    this.store.commit('updateMessage', {
                        index: aiMessageIndex,
                        content: accumulatedContent
                    });
                    break;
                }

                const chunk = decoder.decode(value);
                // console.log('Received chunk:', chunk);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        
                        if (data === '[DONE]') {
                            // Final update before finishing
                            this.store.commit('updateMessage', {
                                index: aiMessageIndex,
                                content: accumulatedContent
                            });
                            return;
                        }
                        
                        // Skip empty data lines
                        if (!data) continue;

                        try {
                            const parsed = JSON.parse(data);
                            
                            // Skip comment payloads (OpenRouter sends these occasionally)
                            if (parsed.type === 'comment') {
                                // console.log('Skipping comment payload');
                                continue;
                            }
                            
                            const content = parsed.choices?.[0]?.delta?.content;
                            
                            if (content) {
                                // console.log('Got content:', content);
                                accumulatedContent += content;
                                
                                // Update UI less frequently to improve performance
                                if (shouldUpdate()) {
                                    this.store.commit('updateMessage', {
                                        index: aiMessageIndex,
                                        content: accumulatedContent
                                    });
                                }
                            }
                        } catch (e) {
                            // console.log('Failed to parse JSON or non-JSON data:', data);
                            continue;
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
            throw error;
        }
    }

    async makeApiRequest(message) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Chat App'
            },
            body: JSON.stringify({
                model: this.store.state.model,
                messages: this.getMessages()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    // Public API methods
    subscribe(property, changeHandler) {
        this.store.subscribe(property, changeHandler);
    }

    getMessages() {
        return this.store.state.messages;
    }

    setSystemMessage(value) {
        this.store.commit('setSystemMessage', value);
    }

    setModel(model) {
        this.store.commit('setModel', model);
    }

    clearMessages() {
        this.store.commit('clearMessages');
    }
}

export default ChatEngine;