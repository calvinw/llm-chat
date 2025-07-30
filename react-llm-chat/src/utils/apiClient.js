/**
 * OpenRouter API client for LLM communication
 * Handles both streaming and non-streaming requests
 */

export class OpenRouterClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  /**
   * Make a streaming chat completion request (matches vanilla JS implementation)
   * @param {Array} messages - Array of message objects
   * @param {string} model - Model ID to use
   * @param {Function} onChunk - Callback for each content chunk
   * @param {Function} onComplete - Callback when streaming completes
   * @param {Function} onError - Callback for errors
   */
  async streamCompletion(messages, model, onChunk, onComplete, onError) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'LLM Chat Interface'
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let updateCount = 0;

      // Throttle updates for performance (same as vanilla JS)
      const shouldUpdate = () => {
        updateCount++;
        return updateCount % 6 === 0; // Update every 6th chunk
      };

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete(accumulatedContent);
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              onComplete(accumulatedContent);
              return;
            }
            
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              
              // Skip OpenRouter comment payloads
              if (parsed.type === 'comment') {
                continue;
              }
              
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                accumulatedContent += content;
                
                // Update UI periodically for smooth streaming (same throttling as vanilla JS)
                if (shouldUpdate()) {
                  onChunk(accumulatedContent);
                }
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', parseError);
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming request failed:', error);
      onError(error);
    }
  }


  /**
   * Make a non-streaming chat completion request (fallback)
   * @param {Array} messages - Array of message objects
   * @param {string} model - Model ID to use
   * @returns {Promise<string>} - The completion text
   */
  async getCompletion(messages, model) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'LLM Chat Interface'
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      console.error('Non-streaming request failed:', error);
      throw error;
    }
  }

  /**
   * Fetch available models from OpenRouter
   * @returns {Promise<Array>} - Array of model objects
   */
  async getModels() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'LLM Chat Interface'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch models:', error);
      throw error;
    }
  }
}

export default OpenRouterClient;