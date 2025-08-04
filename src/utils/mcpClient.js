/**
 * MCP Client with dual transport support
 * Supports both Streamable HTTP and SSE Legacy transports with auto-detection
 * Based on official MCP specification and TypeScript SDK patterns
 */

export class MCPClient {
  constructor(serverUrl, transport = 'auto') {
    this.serverUrl = serverUrl;
    this.transport = transport; // 'auto', 'streamable-http', 'sse-legacy'
    this.tools = [];
    this.connected = false;
    this.messageId = 1;
    this.sessionId = null;
    
    // SSE Legacy transport properties
    this.sseConnection = null;
    this.messageEndpoint = null;
    this.pendingRequests = new Map();
  }

  /**
   * Generate next message ID
   */
  getNextMessageId() {
    return this.messageId++;
  }

  /**
   * Detect which transport the server supports
   */
  async detectTransport() {
    console.log('🔍 Detecting transport for:', this.serverUrl);
    
    // Try modern Streamable HTTP first
    try {
      const testMessage = {
        jsonrpc: '2.0',
        id: 'transport-test',
        method: 'ping',
        params: {}
      };
      
      const response = await fetch(this.serverUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
        },
        body: JSON.stringify(testMessage)
      });
      
      if (response.ok) {
        console.log('✅ Streamable HTTP transport detected');
        return 'streamable-http';
      }
    } catch (e) {
      console.log('❌ Streamable HTTP test failed:', e.message);
    }

    // Try SSE legacy transport
    try {
      const response = await fetch(this.serverUrl, {
        method: 'GET',
        headers: { 'Accept': 'text/event-stream' }
      });
      
      if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
        console.log('✅ SSE Legacy transport detected');
        return 'sse-legacy';
      }
    } catch (e) {
      console.log('❌ SSE Legacy test failed:', e.message);
    }

    throw new Error('No supported MCP transport detected');
  }

  /**
   * Connect to SSE Legacy transport
   * Establishes EventSource connection and waits for endpoint event
   */
  async connectSSELegacy() {
    console.log('🔗 Connecting via SSE Legacy transport:', this.serverUrl);
    
    // Establish SSE connection
    const eventSource = new EventSource(this.serverUrl);
    this.sseConnection = eventSource;
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        eventSource.close();
        reject(new Error('SSE connection timeout'));
      }, 10000);

      eventSource.onopen = () => {
        console.log('✅ SSE connection established');
        clearTimeout(timeout);
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE connection error:', error);
        clearTimeout(timeout);
        eventSource.close();
        reject(new Error('SSE connection failed'));
      };

      // Listen for endpoint event (contains POST endpoint URL)
      eventSource.addEventListener('endpoint', (event) => {
        try {
          // Try parsing as JSON first (spec compliant)
          try {
            const data = JSON.parse(event.data);
            this.messageEndpoint = data.uri;
          } catch (jsonError) {
            // Fallback: treat as plain string (FastMCP format)
            this.messageEndpoint = event.data.trim();
          }
          
          // Ensure endpoint is absolute URL
          if (this.messageEndpoint && !this.messageEndpoint.startsWith('http')) {
            const baseUrl = new URL(this.serverUrl);
            this.messageEndpoint = `${baseUrl.origin}${this.messageEndpoint}`;
          }
          
          console.log('📋 Received message endpoint:', this.messageEndpoint);
          resolve();
        } catch (e) {
          clearTimeout(timeout);
          reject(new Error(`Invalid endpoint event data: ${e.message}`));
        }
      });

      // Listen for message events (server responses)
      eventSource.addEventListener('message', (event) => {
        this.handleSSEMessage(event.data);
      });
    });
  }

  /**
   * Handle SSE message events and correlate with pending requests
   */
  handleSSEMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('📡 Received SSE message:', message);
      
      // Store response for correlation with request ID
      if (message.id && this.pendingRequests.has(message.id)) {
        const resolver = this.pendingRequests.get(message.id);
        resolver(message);
        this.pendingRequests.delete(message.id);
      } else if (message.id) {
        console.warn('⚠️ No pending request for message ID:', message.id);
      }
    } catch (e) {
      console.warn('Failed to parse SSE message:', data, e);
    }
  }

  /**
   * Wait for SSE response with timeout
   */
  waitForSSEResponse(messageId, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error('SSE response timeout'));
      }, timeout);

      console.log(`⏳ Waiting for SSE response with ID: ${messageId}`);
      this.pendingRequests.set(messageId, (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      });
    });
  }

  /**
   * Send a message and handle response (with transport awareness)
   */
  async sendMessage(method, params = {}) {
    if (this.transport === 'sse-legacy') {
      return await this.sendMessageSSELegacy(method, params);
    } else {
      return await this.sendMessageStreamableHTTP(method, params);
    }
  }

  /**
   * Send a notification (no response expected)
   */
  async sendNotification(method, params = {}) {
    if (this.transport === 'sse-legacy') {
      return await this.sendNotificationSSELegacy(method, params);
    } else {
      return await this.sendNotificationStreamableHTTP(method, params);
    }
  }

  /**
   * Send message via SSE Legacy transport
   */
  async sendMessageSSELegacy(method, params = {}) {
    if (!this.messageEndpoint) {
      throw new Error('SSE Legacy: No message endpoint available');
    }

    const message = {
      jsonrpc: '2.0',
      id: this.getNextMessageId(),
      method: method,
      ...(params !== undefined && Object.keys(params).length > 0 && { params: params })
    };

    console.log(`📤 Sending ${method} via SSE Legacy with ID: ${message.id}`);

    // Set up pending request BEFORE sending to avoid race condition
    const responsePromise = this.waitForSSEResponse(message.id);

    // Send via POST to message endpoint
    const response = await fetch(this.messageEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(this.sessionId && method !== 'initialize' && {
          'X-Session-ID': this.sessionId,
          'Session-ID': this.sessionId,
          'MCP-Session-ID': this.sessionId
        })
      },
      body: JSON.stringify(message),
      mode: 'cors'
    });

    if (!response.ok) {
      // Clean up pending request on error
      this.pendingRequests.delete(message.id);
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    // Wait for SSE response
    return await responsePromise;
  }

  /**
   * Send notification via SSE Legacy transport (no response expected)
   */
  async sendNotificationSSELegacy(method, params = {}) {
    if (!this.messageEndpoint) {
      throw new Error('SSE Legacy: No message endpoint available');
    }

    const notification = {
      jsonrpc: '2.0',
      method: method,
      ...(params !== undefined && Object.keys(params).length > 0 && { params: params })
    }; // No ID for notifications

    console.log(`📤 Sending notification ${method} via SSE Legacy`);

    // Send via POST to message endpoint
    const response = await fetch(this.messageEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(this.sessionId && {
          'X-Session-ID': this.sessionId,
          'Session-ID': this.sessionId,
          'MCP-Session-ID': this.sessionId
        })
      },
      body: JSON.stringify(notification),
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    // Notifications don't expect responses
    return { success: true };
  }

  /**
   * Send message via Streamable HTTP transport (existing implementation)
   */
  async sendMessageStreamableHTTP(method, params = {}) {
    const message = {
      jsonrpc: '2.0',
      id: this.getNextMessageId(),
      method: method,
      ...(params !== undefined && Object.keys(params).length > 0 && { params: params })
    };

    console.log(`📤 Sending ${method} via Streamable HTTP`);

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
   * Send notification via Streamable HTTP transport (no response expected)
   */
  async sendNotificationStreamableHTTP(method, params = {}) {
    const notification = {
      jsonrpc: '2.0',
      method: method,
      ...(params !== undefined && Object.keys(params).length > 0 && { params: params })
    }; // No ID for notifications

    console.log(`📤 Sending notification ${method} via Streamable HTTP`);

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add session ID to subsequent requests (if provided by server)
    if (this.sessionId) {
      headers['X-Session-ID'] = this.sessionId;
      headers['Session-ID'] = this.sessionId;
      headers['MCP-Session-ID'] = this.sessionId;
    }

    let response;
    try {
      response = await fetch(this.serverUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(notification),
        mode: 'cors'
      });
    } catch (networkError) {
      console.error('🌐 Network error:', networkError);
      throw new Error(`Network error: ${networkError.message}. Make sure the server is running and CORS is configured.`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    // Notifications don't expect responses
    return { success: true };
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

      // Auto-detect transport if not specified
      if (this.transport === 'auto') {
        this.transport = await this.detectTransport();
        console.log(`🔍 Detected transport: ${this.transport}`);
      }

      // Connect based on transport type
      if (this.transport === 'sse-legacy') {
        await this.connectSSELegacy();
        console.log('✅ SSE Legacy connection established');
      } else {
        console.log('✅ Using Streamable HTTP transport');
      }

      // Step 1: Initialize (works for both transports)
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

      console.log('✅ Initialized:', initResult);

      // Check if server provided a session ID in the response
      if (initResult.result && initResult.result.sessionId) {
        this.sessionId = initResult.result.sessionId;
        console.log('🔑 Server provided session ID:', this.sessionId);
      }

      // Send initialized notification (required by MCP protocol)
      console.log('📤 Sending initialized notification...');
      await this.sendNotification('notifications/initialized');

      // Small delay for SSE Legacy to ensure initialization is complete
      if (this.transport === 'sse-legacy') {
        console.log('⏳ Waiting for SSE initialization to complete...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Increased to 500ms
      }

      // Step 2: List tools (some servers expect no params)
      const toolsResult = await this.sendMessage('tools/list');

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
      console.log(`🎉 Connected via ${this.transport}! Found ${this.tools.length} tools:`, this.tools.map(t => t.function.name));

      return { success: true, tools: this.tools, transport: this.transport };
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
    console.log('🔌 Disconnecting MCP client');
    
    // Close SSE connection if exists
    if (this.sseConnection) {
      this.sseConnection.close();
      this.sseConnection = null;
      console.log('✅ SSE connection closed');
    }
    
    // Clear endpoints and pending requests
    this.messageEndpoint = null;
    this.pendingRequests.clear();
    
    // Reset connection state
    this.connected = false;
    this.tools = [];
    this.sessionId = null;
    
    console.log('✅ MCP client disconnected');
  }
}