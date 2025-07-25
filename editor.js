import ChatEngine from './chat-engine.js';
import DEFAULT_SYSTEM_PROMPT from './defaults.js';

// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const sendButton = document.getElementById('send-button');
const messageInput = document.getElementById('message-input');
const clearChatButton = document.getElementById('clear-messages');

const apiKey="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"



let chatEngine = null;

async function initializeChatEngine(apiKey) {
    chatEngine = new ChatEngine({
        model: "openai/gpt-4o-mini",
        apiKey: apiKey,
        systemPrompt: DEFAULT_SYSTEM_PROMPT
    });

    window.chatEngine = chatEngine;

    chatEngine.subscribe("messages", updateMessagesUI);

    // Set up subscriptions - no need to display current model since dropdown shows it

    // System message handling removed - using default only


const displayModeSelect = document.getElementById('displayMode');
displayModeSelect.addEventListener('change', (e) => {
    updateMessagesUI();
});

    clearChatButton.addEventListener('click', () => {
        if (chatEngine) {
            chatEngine.store.commit('clearMessages');
        }
    });

    const modelSelect = document.getElementById('model');
    modelSelect.addEventListener('change', function() {
      if (chatEngine) {
        chatEngine.store.commit("setModel", this.value);
      }
    });

      // Remove auto-close sidebar functionality - let user control it

}

function preprocessMarkdownForMath(markdown) {
return markdown.replace(/\\\(/g, '\\\\(')
		 .replace(/\\\)/g, '\\\\)')
		 .replace(/\\\[/g, '\\\\[')
		 .replace(/\\\]/g, '\\\\]')
		 .replace(/\\\$/g, '\\\\$');
}

// Event listeners
sendButton.addEventListener('click', (e) => {
    e.preventDefault();
    sendMessage();
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    let message = messageInput.value.trim();
    if (!message) return;

    // Check if chatEngine is initialized
    if (!chatEngine) {
        const settingsError = document.getElementById('settingsError');
        if (settingsError) {
            settingsError.textContent = 'Please enter your OpenRouter API key first.';
            settingsError.classList.remove('hidden');
        }
        return;
    }

    messageInput.value = '';
    messageInput.focus();

    try {
        await chatEngine.sendMessage(message);
        // Clear any previous errors on success
        const settingsError = document.getElementById('settingsError');
        if (settingsError) {
            settingsError.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        const settingsError = document.getElementById('settingsError');
        if (settingsError) {
            if (error.message.includes('CORS') || window.location.protocol === 'file:') {
                settingsError.textContent = 'CORS error: Please run this app from a web server (not file://) or use a browser extension like CORS Unblock.';
            } else {
                settingsError.textContent = 'Error sending message. Please check your API key and selected model.';
            }
            settingsError.classList.remove('hidden');
        }
    }
}

const messagesInsideDiv = document.getElementById('messages-inside');

function updateMessagesUIText() {
    const messages = chatEngine.getMessages();
    
    let messagesHTML = messages
        .filter(msg => msg.role !== 'system')
        .map((msg, index) => {
            const roleLabel = msg.role === 'user' ? 'USER' : 'AI';
            
            // Add streaming indicator for empty AI messages (streaming in progress)
            const isLastMessage = index === messages.filter(msg => msg.role !== 'system').length - 1;
            const isEmptyAI = msg.role === 'assistant' && msg.content.trim() === '';
            const streamingIndicator = (isLastMessage && isEmptyAI) ? '<span class="streaming-indicator"></span>' : '';
            
            const borderClass = msg.role === 'user' ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-green-400';
            return `<div class="p-3 rounded border border-gray-200 ${borderClass} font-mono text-sm"><span class="font-semibold text-gray-800">${roleLabel}:</span> <span class="text-gray-700 whitespace-pre-wrap">${msg.content}${streamingIndicator}</span></div>`;
        })
        .join('');

    messagesInsideDiv.innerHTML = messagesHTML;
}


function updateMessagesUIMarkdown() {
    const messages = chatEngine.getMessages();
    const visibleMessages = messages.filter(msg => msg.role !== 'system');
    
    const currentChildren = messagesInsideDiv.children.length;
    const messageCount = visibleMessages.length;
    
    if (currentChildren < messageCount) {
        // Add new messages incrementally
        addNewMessages(visibleMessages, currentChildren);
    } else if (currentChildren === messageCount) {
        // Update existing last message (streaming)
        updateLastMessage(visibleMessages);
    } else {
        // Should rarely happen - full render as fallback
        renderAllMessages(visibleMessages);
    }
}

function renderAllMessages(visibleMessages) {
    // Initialize markdown-it with better defaults
    const md = window.markdownit({
        html: false,        // Disable HTML tags in source
        breaks: false,      // Don't convert '\n' in paragraphs into <br>
        linkify: true,      // Autoconvert URL-like text to links
        typographer: false  // Disable some language-neutral replacement + quotes beautification
    });

    let messagesHTML = visibleMessages
        .map((msg, index) => {
            const roleLabel = msg.role === 'user' ? 'USER' : 'AI';
            const processedMarkdown = preprocessMarkdownForMath(msg.content.trim())
            let contentHtml = md.render(processedMarkdown);
            
            // Cleanup for list items
            contentHtml = contentHtml
                .replace(/^\s*<p>/, '')     // Remove opening <p> at start
                .replace(/<\/p>\s*$/, '')   // Remove closing </p> at end
                .replace(/<li><p>/g, '<li>') // Remove <p> tags inside list items
                .replace(/<\/p><\/li>/g, '</li>') // Remove </p> tags inside list items
                .trim();
            
            // Add streaming indicator for empty AI messages (streaming in progress)
            const isLastMessage = index === visibleMessages.length - 1;
            const isEmptyAI = msg.role === 'assistant' && msg.content.trim() === '';
            const streamingIndicator = (isLastMessage && isEmptyAI) ? '<span class="streaming-indicator"></span>' : '';
            
            const borderClass = msg.role === 'user' ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-green-400';
            return `<div class="chat-message p-3 rounded border border-gray-200 ${borderClass}"><span class="font-semibold text-gray-800">${roleLabel}:</span> <span class="text-gray-700">${contentHtml}${streamingIndicator}</span></div>`;
        })
        .join('');

    messagesInsideDiv.innerHTML = messagesHTML;
    renderMath(messagesInsideDiv);
}

function addNewMessages(visibleMessages, startIndex) {
    // Initialize markdown-it
    const md = window.markdownit({
        html: false,
        breaks: false,
        linkify: true,
        typographer: false
    });
    
    // Only process new messages from startIndex onwards
    for (let i = startIndex; i < visibleMessages.length; i++) {
        const msg = visibleMessages[i];
        const roleLabel = msg.role === 'user' ? 'USER' : 'AI';
        const processedMarkdown = preprocessMarkdownForMath(msg.content.trim());
        let contentHtml = md.render(processedMarkdown);
        
        // Cleanup for list items
        contentHtml = contentHtml
            .replace(/^\s*<p>/, '')
            .replace(/<\/p>\s*$/, '')
            .replace(/<li><p>/g, '<li>')
            .replace(/<\/p><\/li>/g, '</li>')
            .trim();
        
        // Add streaming indicator for empty AI messages
        const isEmptyAI = msg.role === 'assistant' && msg.content.trim() === '';
        const streamingIndicator = isEmptyAI ? '<span class="streaming-indicator"></span>' : '';
        
        const borderClass = msg.role === 'user' ? 'border-l-4 border-l-blue-400' : 'border-l-4 border-l-green-400';
        
        // Create new message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message p-3 rounded border border-gray-200 ${borderClass}`;
        messageDiv.innerHTML = `<span class="font-semibold text-gray-800">${roleLabel}:</span> <span class="text-gray-700">${contentHtml}${streamingIndicator}</span>`;
        
        // Append to container
        messagesInsideDiv.appendChild(messageDiv);
        
        // Render math only for this new element
        renderMath(messageDiv);
    }
}

function updateLastMessage(visibleMessages) {
    if (visibleMessages.length === 0) return;
    
    const lastMessage = visibleMessages[visibleMessages.length - 1];
    const lastElement = messagesInsideDiv.lastElementChild;
    
    if (!lastElement || lastMessage.role !== 'assistant') return;
    
    // Initialize markdown-it
    const md = window.markdownit({
        html: false,
        breaks: false,
        linkify: true,
        typographer: false
    });
    
    const processedMarkdown = preprocessMarkdownForMath(lastMessage.content.trim());
    let contentHtml = md.render(processedMarkdown);
    
    // Cleanup for list items
    contentHtml = contentHtml
        .replace(/^\s*<p>/, '')
        .replace(/<\/p>\s*$/, '')
        .replace(/<li><p>/g, '<li>')
        .replace(/<\/p><\/li>/g, '</li>')
        .trim();
    
    // Add streaming indicator for empty messages
    const isEmptyAI = lastMessage.content.trim() === '';
    const streamingIndicator = isEmptyAI ? '<span class="streaming-indicator"></span>' : '';
    
    // Update only the content span of the last message
    const contentSpan = lastElement.querySelector('.text-gray-700');
    if (contentSpan) {
        contentSpan.innerHTML = `${contentHtml}${streamingIndicator}`;
        // Only render math for the updated element
        renderMath(lastElement);
    }
}

  function renderMath(element) {
      if (window.MathJax) {
          window.MathJax.typesetPromise([element])
              .catch((err) => console.error('MathJax typesetting failed:', err));
      }
  }


function updateMessagesUI() {
    const displayMode = document.getElementById('displayMode').value;
    // console.log('Display mode:', displayMode);
    
    if (displayMode === 'markdown') {
        // console.log('Calling updateMessagesUIMarkdown');
        updateMessagesUIMarkdown();
    } else {
        // console.log('Calling updateMessagesUIText');
        updateMessagesUIText();
    }

    // Auto-scroll to bottom for streaming (throttled)
    const messagesContent = document.getElementById('messages-content');
    if (messagesContent) {
        messagesContent.scrollTop = messagesContent.scrollHeight;
    }
}


document.addEventListener('DOMContentLoaded', function() {
    if (typeof apiKey !== 'undefined' && apiKey) {
        apiKeyInput.value = apiKey;
        initializeChatEngine(apiKey);
    }
    else {
        apiKeyInput.addEventListener('input', function() {
            const key = apiKeyInput.value.trim();
            if (key) {
                initializeChatEngine(key);
            }
        });
    }
});
