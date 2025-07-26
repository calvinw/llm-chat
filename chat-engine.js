/**
 * ChatEngine - Core Chat Logic and API Communication
 * Handles OpenRouter API communication, message state management, and streaming
 */

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Safely access nested object properties using dot notation
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot-separated path (e.g., 'user.profile.name')
 * @returns {*} - Value at path or undefined
 */
const getNestedProperty = (obj, path) => {
    if (typeof path !== 'string') path = String(path);
    return path.split('.').reduce((acc, key) => acc && acc[key], obj);
};

// =============================================================================
// STATE MANAGEMENT STORE
// =============================================================================

/**
 * Simple state management store with subscription system
 * Similar to Vuex/Redux but lightweight for this application
 */
class Store {
    constructor(options = {}) {
        this.state = options.state || {};
        this.mutations = options.mutations || {};
        this.subscribers = [];
    }

    /**
     * Commit a mutation to update state
     * @param {string} mutation - Name of mutation to execute
     * @param {*} payload - Data to pass to mutation
     */
    commit(mutation, payload) {
        if (!this.mutations[mutation]) {
            console.error(`Mutation ${mutation} does not exist`);
            return;
        }
        
        // Create deep copy of current state for comparison
        const prevState = JSON.parse(JSON.stringify(this.state));
        
        // Execute mutation
        this.mutations[mutation](this.state, payload);
        
        // Notify all subscribers of changes
        this.notifySubscribers(prevState);
    }

    /**
     * Subscribe to state changes at a specific path
     * @param {string} path - State path to watch (e.g., 'messages')
     * @param {Function} fn - Callback function to execute on changes
     */
    subscribe(path, fn) {
        this.subscribers.push({ path, fn });
        
        // Immediately call with current value
        const currentValue = getNestedProperty(this.state, path);
        fn(currentValue, undefined);
    }

    /**
     * Notify all subscribers when state changes
     * @param {Object} prevState - Previous state for comparison
     */
    notifySubscribers(prevState) {
        this.subscribers.forEach(({ path, fn }) => {
            const newValue = getNestedProperty(this.state, path);
            const prevValue = getNestedProperty(prevState, path);
            
            // Only notify if value actually changed
            if (JSON.stringify(newValue) !== JSON.stringify(prevValue)) {
                fn(newValue, prevValue);
            }
        });
    }
}

// =============================================================================
// MAIN CHAT ENGINE CLASS
// =============================================================================

/**
 * Main ChatEngine class - handles all chat functionality
 * Features:
 * - OpenRouter API integration with streaming support
 * - State management for messages and settings
 * - Fallback to non-streaming if streaming fails
 * - Model switching and system prompt management
 */
class ChatEngine {
    constructor(config) {
        // Validate required configuration
        if (!config.apiKey) throw new Error('API key is required');
        if (!config.model) throw new Error('Model name is required');

        this.apiKey = config.apiKey;
        this.model = config.model;
        this.setupStore(config.systemPrompt);
    }

    /**
     * Initialize the state store with default values and mutations
     * @param {string} systemPrompt - Initial system prompt for the AI
     */
    setupStore(systemPrompt) {
        this.store = new Store({
            state: {
                model: this.model,
                messages: [{
                    role: 'system',
                    content: systemPrompt || 'You are a helpful AI assistant.'
                }]
            },
            mutations: {
                // Update the current model
                setModel: (state, model) => {
                    state.model = model;
                },
                
                // Update the system message (first message in conversation)
                setSystemMessage: (state, message) => {
                    state.messages[0].content = message;
                },
                
                // Add new message to conversation
                addMessage: (state, message) => {
                    state.messages.push(message);
                },
                
                // Clear all messages except system message
                clearMessages: (state) => {
                    state.messages = [{
                        role: 'system',
                        content: state.messages[0].content
                    }];
                },
                
                // Update existing message content (used for streaming)
                updateMessage: (state, { index, content }) => {
                    if (state.messages[index]) {
                        state.messages[index].content = content;
                    }
                }
            }
        });
    }

    // =============================================================================
    // MESSAGE SENDING
    // =============================================================================

    /**
     * Send user message and get AI response
     * @param {string} userMessage - User's message text
     */
    async sendMessage(userMessage) {
        // Add user message to conversation
        this.store.commit('addMessage', {
            role: "user",
            content: userMessage
        });

        // Add placeholder AI message for streaming updates
        const aiMessageIndex = this.store.state.messages.length;
        this.store.commit('addMessage', {
            role: 'assistant',
            content: ''
        });

        try {
            // Try streaming first
            await this.makeStreamingApiRequest(aiMessageIndex);
        } catch (error) {
            console.error('Streaming failed, falling back to non-streaming:', error.message);
            
            // Fallback to non-streaming API call
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

    // =============================================================================
    // API COMMUNICATION - STREAMING
    // =============================================================================

    /**
     * Make streaming API request to OpenRouter
     * Updates UI in real-time as response streams in
     * @param {number} aiMessageIndex - Index of AI message to update
     */
    async makeStreamingApiRequest(aiMessageIndex) {
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
                messages: this.getMessages().slice(0, -1), // Exclude empty AI message
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Set up streaming response reader
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let updateCount = 0;

        // Throttle UI updates for better performance
        const shouldUpdate = () => {
            updateCount++;
            return updateCount % 6 === 0; // Update every 6th chunk
        };

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    // Ensure final content is displayed
                    this.store.commit('updateMessage', {
                        index: aiMessageIndex,
                        content: accumulatedContent
                    });
                    break;
                }

                // Process streaming chunk
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        
                        // Check for stream end signal
                        if (data === '[DONE]') {
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
                            
                            // Skip OpenRouter comment payloads
                            if (parsed.type === 'comment') {
                                continue;
                            }
                            
                            // Extract content from response
                            const content = parsed.choices?.[0]?.delta?.content;
                            
                            if (content) {
                                accumulatedContent += content;
                                
                                // Update UI periodically for smooth streaming
                                if (shouldUpdate()) {
                                    this.store.commit('updateMessage', {
                                        index: aiMessageIndex,
                                        content: accumulatedContent
                                    });
                                }
                            }
                        } catch (e) {
                            // Skip malformed JSON data
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

    // =============================================================================
    // API COMMUNICATION - NON-STREAMING FALLBACK
    // =============================================================================

    /**
     * Make non-streaming API request (fallback method)
     * @returns {Object} - Full API response
     */
    async makeApiRequest() {
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

    // =============================================================================
    // PUBLIC API METHODS
    // =============================================================================

    /**
     * Subscribe to state changes
     * @param {string} property - State property to watch
     * @param {Function} changeHandler - Callback for changes
     */
    subscribe(property, changeHandler) {
        this.store.subscribe(property, changeHandler);
    }

    /**
     * Get all messages in conversation
     * @returns {Array} - Array of message objects
     */
    getMessages() {
        return this.store.state.messages;
    }

    /**
     * Update system message
     * @param {string} value - New system prompt
     */
    setSystemMessage(value) {
        this.store.commit('setSystemMessage', value);
    }

    /**
     * Change AI model
     * @param {string} model - Model identifier
     */
    setModel(model) {
        this.store.commit('setModel', model);
    }

    /**
     * Clear conversation (keeping system message)
     */
    clearMessages() {
        this.store.commit('clearMessages');
    }
}

export default ChatEngine;