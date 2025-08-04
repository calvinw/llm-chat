/**
 * Improved MCP Client based on official TypeScript SDK patterns
 * Handles both JSON and SSE responses properly
 */

export class ImprovedMCPClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.tools = [];
    this.connected = false;
    this.messageId = 1;
    this.sessionId = null;
  }

  /**
   * Generate next message ID
   */
  getNextMessageId() {
    return this.messageId++;
  }

  /**
   * Send a message and handle response (JSON or SSE)
   */
  async sendMessage(method, params = {}) {
    const message = {
      jsonrpc: '2.0',
      id: this.getNextMessageId(),
      method: method,
      params: params
    };

    console.log(`📤 Sending ${method}:`, message);

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    };

    // Add session ID to subsequent requests (if provided by server)
    if (this.sessionId && method !== 'initialize') {
      headers['X-Session-ID'] = this.sessionId;
      headers['Session-ID'] = this.sessionId;
      headers['MCP-Session-ID'] = this.sessionId;
      console.log(`📋 Using session ID: ${this.sessionId}`);
    }

    let response;
    try {
      response = await fetch(this.serverUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(message),
        mode: 'cors'
      });
    } catch (networkError) {
      console.error('🌐 Network error:', networkError);
      throw new Error(`Network error: ${networkError.message}. Make sure the server is running and CORS is configured.`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    const contentType = response.headers.get('content-type') || '';
    console.log(`📋 Response content-type: ${contentType}`);

    if (contentType.includes('text/event-stream')) {
      return await this.handleSSEResponse(response);
    } else if (contentType.includes('application/json')) {
      return await response.json();
    } else {
      throw new Error(`Unexpected content type: ${contentType}`);
    }
  }

  /**
   * Handle Server-Sent Events response
   */
  async handleSSEResponse(response) {
    const text = await response.text();
    console.log('📡 SSE response:', text);

    // Parse SSE format - look for data lines
    const lines = text.split('\n');
    const messages = [];

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const jsonData = line.substring(6).trim();
          if (jsonData && jsonData !== '[DONE]') {
            const message = JSON.parse(jsonData);
            messages.push(message);
          }
        } catch (e) {
          console.warn('Failed to parse SSE data line:', line, e);
        }
      }
    }

    // Return the first valid message (most common case)
    if (messages.length > 0) {
      console.log('✅ Parsed SSE messages:', messages);
      return messages[0];
    }

    throw new Error('No valid JSON messages found in SSE response');
  }

  /**
   * Connect to MCP server and initialize
   */
  async connect() {
    try {
      console.log('🔗 Connecting to MCP server:', this.serverUrl);

      // Step 1: Initialize
      const initResult = await this.sendMessage('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        clientInfo: {
          name: 'llm-chat-interface',
          version: '1.0.0'
        }
      });

      if (initResult.error) {
        throw new Error(`Initialize error: ${initResult.error.message}`);
      }

      console.log('✅ Initialized (stateless):', initResult);

      // Check if FastMCP provided a session ID in the response
      if (initResult.result && initResult.result.sessionId) {
        this.sessionId = initResult.result.sessionId;
        console.log('🔑 Server provided session ID:', this.sessionId);
      }

      // Step 2: List tools
      const toolsResult = await this.sendMessage('tools/list', {});

      if (toolsResult.error) {
        throw new Error(`Tools list error: ${toolsResult.error.message}`);
      }

      // Convert to OpenAI function format
      this.tools = toolsResult.result.tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema || {
            type: 'object',
            properties: {},
            required: []
          }
        },
        _mcpTool: true
      }));

      this.connected = true;
      console.log(`🎉 Connected! Found ${this.tools.length} tools:`, this.tools.map(t => t.function.name));

      return { success: true, tools: this.tools };
    } catch (error) {
      console.error('❌ Connection failed:', error);
      this.connected = false;
      return { success: false, error: error.message };
    }
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(toolName, args) {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }

    try {
      const result = await this.sendMessage('tools/call', {
        name: toolName,
        arguments: args || {}
      });

      if (result.error) {
        throw new Error(`Tool call error: ${result.error.message}`);
      }

      // Extract content from result
      let content = result.result.content;
      if (Array.isArray(content)) {
        content = content.map(item => item.text || item.content || JSON.stringify(item)).join(' ');
      } else if (typeof content === 'object') {
        content = JSON.stringify(content);
      }

      return {
        content: content.toString(),
        tool_call_id: `mcp_${toolName}_${Date.now()}`
      };
    } catch (error) {
      console.error(`Failed to call tool ${toolName}:`, error);
      throw error;
    }
  }

  getTools() {
    return this.tools;
  }

  isConnected() {
    return this.connected;
  }

  disconnect() {
    this.connected = false;
    this.tools = [];
  }
}