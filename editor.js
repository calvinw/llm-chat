/**
 * Chat UI Controller
 * Handles all user interface interactions, message rendering, and display modes
 */

import ChatEngine from './chat-engine.js';
import DEFAULT_SYSTEM_PROMPT, { DEFAULT_MODEL } from './defaults.js';

// =============================================================================
// DOM ELEMENTS AND GLOBAL STATE
// =============================================================================

// Core DOM elements
const apiKeyInput = document.getElementById('apiKey');
const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');
const clearChatButton = document.getElementById('clear-messages');
const displayModeSelect = document.getElementById('displayMode');
const modelSelect = document.getElementById('model');
const messagesInsideDiv = document.getElementById('messages-inside');

// Global chat engine instance
let chatEngine = null;

// =============================================================================
// CHAT ENGINE INITIALIZATION
// =============================================================================

/**
 * Initialize the ChatEngine with API key and set up subscriptions
 * @param {string} apiKey - OpenRouter API key
 */
async function initializeChatEngine(apiKey) {
    try {
        chatEngine = new ChatEngine({
            model: DEFAULT_MODEL,
            apiKey: apiKey,
            systemPrompt: DEFAULT_SYSTEM_PROMPT
        });

        // Make available globally for debugging
        window.chatEngine = chatEngine;

        // Subscribe to message updates to refresh UI
        chatEngine.subscribe("messages", updateMessagesUI);

        console.log('ChatEngine initialized successfully');
    } catch (error) {
        console.error('Failed to initialize ChatEngine:', error);
        showError('Please enter a valid OpenRouter API key.');
    }
}

// =============================================================================
// MATH PROCESSING FOR MARKDOWN
// =============================================================================

/**
 * Protects LaTeX math expressions from markdown processing corruption
 * Replaces math expressions with placeholders, then restores them after markdown processing
 * @param {string} markdown - Raw markdown text with potential math expressions
 * @returns {Object} - Object with processed content and restore function
 */
function preprocessMarkdownForMath(markdown) {
    const mathParts = [];
    let counter = 0;
    
    // Step 1: Replace display math $$...$$ with placeholders FIRST (order matters!)
    let processed = markdown.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
        const placeholder = `XMATHPLACEHOLDERX${counter}XDISPLAYXMATH`;
        mathParts[counter] = match;
        counter++;
        return placeholder;
    });
    
    // Step 2: Replace inline math $...$ with placeholders (after display math)
    processed = processed.replace(/\$([^$\n]*?)\$/g, (match, content) => {
        const placeholder = `XMATHPLACEHOLDERX${counter}XINLINEXMATH`;
        mathParts[counter] = match;
        counter++;
        return placeholder;
    });
    
    // Step 3: Escape other LaTeX delimiters to prevent conflicts
    processed = processed.replace(/\\\(/g, '\\\\(')
                      .replace(/\\\)/g, '\\\\)')
                      .replace(/\\\[/g, '\\\\[')
                      .replace(/\\\]/g, '\\\\]')
                      .replace(/\\\$/g, '\\\\$');
    
    return {
        content: processed,
        restoreMath: function(htmlString) {
            let restored = htmlString;
            for (let i = 0; i < counter; i++) {
                const displayPlaceholder = `XMATHPLACEHOLDERX${i}XDISPLAYXMATH`;
                const inlinePlaceholder = `XMATHPLACEHOLDERX${i}XINLINEXMATH`;
                
                // Use string replacement instead of regex to avoid $ interpretation issues
                if (restored.includes(displayPlaceholder)) {
                    restored = restored.split(displayPlaceholder).join(mathParts[i]);
                }
                if (restored.includes(inlinePlaceholder)) {
                    restored = restored.split(inlinePlaceholder).join(mathParts[i]);
                }
            }
            return restored;
        }
    };
}

/**
 * Render LaTeX math expressions using MathJax
 * @param {HTMLElement} element - DOM element containing math expressions
 */
function renderMath(element) {
    if (window.MathJax) {
        window.MathJax.typesetPromise([element])
            .catch((err) => console.error('MathJax typesetting failed:', err));
    }
}

// =============================================================================
// MESSAGE RENDERING - PLAIN TEXT MODE
// =============================================================================

/**
 * Render messages in plain text mode (monospace font, no markdown processing)
 * Used when display mode is set to "text"
 */
function updateMessagesUIText() {
    if (!chatEngine) return;
    
    const messages = chatEngine.getMessages();
    const visibleMessages = messages.filter(msg => msg.role !== 'system');
    
    // Mark current display mode for proper switching detection
    messagesInsideDiv.dataset.lastDisplayMode = 'text';
    
    // Generate HTML for all messages with monospace styling
    const messagesHTML = visibleMessages
        .map((msg, index) => {
            const roleLabel = msg.role === 'user' ? 'USER' : 'AI';
            const isLastMessage = index === visibleMessages.length - 1;
            const isEmptyAI = msg.role === 'assistant' && msg.content.trim() === '';
            const streamingIndicator = (isLastMessage && isEmptyAI) ? '<span class="streaming-indicator"></span>' : '';
            const borderClass = msg.role === 'user' ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-green-400';
            
            return `<div class="p-3 rounded border border-gray-200 ${borderClass} font-mono text-sm">
                <span class="font-semibold text-gray-800">${roleLabel}:</span> 
                <span class="text-gray-700 whitespace-pre-wrap">${msg.content}${streamingIndicator}</span>
            </div>`;
        })
        .join('');

    messagesInsideDiv.innerHTML = messagesHTML;
}

// =============================================================================
// MESSAGE RENDERING - MARKDOWN MODE
// =============================================================================

/**
 * Render messages in markdown mode with full formatting and math support
 * Handles incremental updates during streaming and full re-renders on mode changes
 */
function updateMessagesUIMarkdown() {
    if (!chatEngine) return;
    
    const messages = chatEngine.getMessages();
    const visibleMessages = messages.filter(msg => msg.role !== 'system');
    
    // Check if display mode changed - if so, force full re-render
    const displayMode = document.getElementById('displayMode').value;
    const lastDisplayMode = messagesInsideDiv.dataset.lastDisplayMode;
    
    if (displayMode !== lastDisplayMode) {
        messagesInsideDiv.dataset.lastDisplayMode = displayMode;
        renderAllMessages(visibleMessages);
        return;
    }
    
    // Determine rendering strategy based on current state
    const currentChildren = messagesInsideDiv.children.length;
    const messageCount = visibleMessages.length;
    
    if (currentChildren < messageCount) {
        // New messages arrived - add them incrementally
        addNewMessages(visibleMessages, currentChildren);
    } else if (currentChildren === messageCount) {
        // Same number of messages - update last message (streaming)
        updateLastMessage(visibleMessages);
    } else {
        // Fewer messages than before - full re-render needed
        renderAllMessages(visibleMessages);
    }
}

/**
 * Render all messages from scratch (used for display mode changes and fallbacks)
 * @param {Array} visibleMessages - Array of message objects to render
 */
function renderAllMessages(visibleMessages) {
    // Initialize markdown-it with conservative settings
    const md = window.markdownit({
        html: false,        // Disable HTML tags in source for security
        breaks: false,      // Don't convert '\n' in paragraphs into <br>
        linkify: true,      // Autoconvert URL-like text to links
        typographer: false  // Disable smart quotes and other replacements
    });

    const messagesHTML = visibleMessages
        .map((msg, index) => {
            const roleLabel = msg.role === 'user' ? 'USER' : 'AI';
            
            // Process markdown with math protection
            const mathProcessor = preprocessMarkdownForMath(msg.content.trim());
            let contentHtml = md.render(mathProcessor.content);
            contentHtml = mathProcessor.restoreMath(contentHtml);
            
            // Add streaming indicator for empty AI messages
            const isLastMessage = index === visibleMessages.length - 1;
            const isEmptyAI = msg.role === 'assistant' && msg.content.trim() === '';
            const streamingIndicator = (isLastMessage && isEmptyAI) ? '<span class="streaming-indicator"></span>' : '';
            
            const borderClass = msg.role === 'user' ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-green-400';
            
            return `<div class="chat-message p-3 rounded border border-gray-200 ${borderClass}">
                <span class="font-semibold text-gray-800">${roleLabel}:</span> 
                <span class="text-gray-700">${contentHtml}${streamingIndicator}</span>
            </div>`;
        })
        .join('');

    messagesInsideDiv.innerHTML = messagesHTML;
    renderMath(messagesInsideDiv);
}

/**
 * Add new messages incrementally (used during normal chat flow)
 * @param {Array} visibleMessages - All visible messages
 * @param {number} startIndex - Index to start adding from
 */
function addNewMessages(visibleMessages, startIndex) {
    const md = window.markdownit({
        html: false,
        breaks: false,
        linkify: true,
        typographer: false
    });
    
    // Process only new messages from startIndex onwards
    for (let i = startIndex; i < visibleMessages.length; i++) {
        const msg = visibleMessages[i];
        const roleLabel = msg.role === 'user' ? 'USER' : 'AI';
        
        // Process markdown with math protection
        const mathProcessor = preprocessMarkdownForMath(msg.content.trim());
        let contentHtml = md.render(mathProcessor.content);
        contentHtml = mathProcessor.restoreMath(contentHtml);
        
        // Add streaming indicator for empty AI messages
        const isEmptyAI = msg.role === 'assistant' && msg.content.trim() === '';
        const streamingIndicator = isEmptyAI ? '<span class="streaming-indicator"></span>' : '';
        const borderClass = msg.role === 'user' ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-green-400';
        
        // Create and append new message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message p-3 rounded border border-gray-200 ${borderClass}`;
        messageDiv.innerHTML = `<span class="font-semibold text-gray-800">${roleLabel}:</span> <span class="text-gray-700">${contentHtml}${streamingIndicator}</span>`;
        
        messagesInsideDiv.appendChild(messageDiv);
        renderMath(messageDiv);
    }
}

/**
 * Update the content of the last message (used during streaming)
 * @param {Array} visibleMessages - All visible messages
 */
function updateLastMessage(visibleMessages) {
    if (visibleMessages.length === 0) return;
    
    const lastMessage = visibleMessages[visibleMessages.length - 1];
    const lastElement = messagesInsideDiv.lastElementChild;
    
    // Only update AI messages (user messages don't change after sending)
    if (!lastElement || lastMessage.role !== 'assistant') return;
    
    const md = window.markdownit({
        html: false,
        breaks: false,
        linkify: true,
        typographer: false
    });
    
    // Process markdown with math protection
    const mathProcessor = preprocessMarkdownForMath(lastMessage.content.trim());
    let contentHtml = md.render(mathProcessor.content);
    contentHtml = mathProcessor.restoreMath(contentHtml);
    
    // Add streaming indicator for empty messages
    const isEmptyAI = lastMessage.content.trim() === '';
    const streamingIndicator = isEmptyAI ? '<span class="streaming-indicator"></span>' : '';
    
    // Update only the content span, preserving the role label
    const contentSpan = lastElement.querySelector('.text-gray-700');
    if (contentSpan) {
        contentSpan.innerHTML = `${contentHtml}${streamingIndicator}`;
        renderMath(lastElement);
    }
}

// =============================================================================
// MAIN UI UPDATE CONTROLLER
// =============================================================================

/**
 * Main UI update function - routes to appropriate rendering mode and handles scrolling
 */
function updateMessagesUI() {
    const displayMode = document.getElementById('displayMode').value;
    
    // Route to appropriate rendering function
    if (displayMode === 'markdown') {
        updateMessagesUIMarkdown();
    } else {
        updateMessagesUIText();
    }

    // Auto-scroll to bottom to follow conversation
    const messagesContent = document.getElementById('messages-content');
    if (messagesContent) {
        messagesContent.scrollTop = messagesContent.scrollHeight;
    }
}

// =============================================================================
// MESSAGE SENDING
// =============================================================================

/**
 * Send user message to chat engine
 */
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Ensure chat engine is initialized
    if (!chatEngine) {
        showError('Please enter your OpenRouter API key first.');
        return;
    }

    // Clear input and maintain focus
    messageInput.value = '';
    messageInput.focus();

    try {
        await chatEngine.sendMessage(message);
        hideError();
    } catch (error) {
        console.error('Error sending message:', error);
        
        if (error.message.includes('CORS') || window.location.protocol === 'file:') {
            showError('CORS error: Please run this app from a web server (not file://) or use a browser extension like CORS Unblock.');
        } else {
            showError('Error sending message. Please check your API key and selected model.');
        }
    }
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
function showError(message) {
    const settingsError = document.getElementById('settingsError');
    if (settingsError) {
        settingsError.textContent = message;
        settingsError.classList.remove('hidden');
    }
}

/**
 * Hide error message
 */
function hideError() {
    const settingsError = document.getElementById('settingsError');
    if (settingsError) {
        settingsError.classList.add('hidden');
    }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

/**
 * Set up all event listeners for UI interactions
 */
function initializeEventListeners() {
    // Send message on button click
    sendButton.addEventListener('click', (e) => {
        e.preventDefault();
        sendMessage();
    });

    // Send message on Enter key (but not Shift+Enter)
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Handle display mode changes
    displayModeSelect.addEventListener('change', () => {
        updateMessagesUI();
    });

    // Handle clear messages button
    clearChatButton.addEventListener('click', () => {
        if (chatEngine) {
            chatEngine.store.commit('clearMessages');
        }
    });

    // Handle model selection changes
    modelSelect.addEventListener('change', function() {
        if (chatEngine) {
            chatEngine.store.commit("setModel", this.value);
        }
    });

    // Handle API key input changes
    apiKeyInput.addEventListener('input', function() {
        const key = apiKeyInput.value.trim();
        if (key && key.length > 10) {
            initializeChatEngine(key);
            hideError();
        } else {
            chatEngine = null;
        }
    });
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    initializeEventListeners();
    
    // No hardcoded API key - user must enter their own key
    
    console.log('Chat application initialized');
});