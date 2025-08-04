import React from 'react';
import { ImprovedMCPClient } from '../utils/mcpClient.js';

/**
 * Hook to manage MCP server connections and tools
 */
const useMCPManager = () => {
  const [mcpServerUrl, setMcpServerUrl] = React.useState('');
  const [mcpConnectionStatus, setMcpConnectionStatus] = React.useState(null);
  const [mcpTools, setMcpTools] = React.useState([]);
  const [mcpToolHandlers, setMcpToolHandlers] = React.useState({});
  const [mcpClient, setMcpClient] = React.useState(null);

  // Connect to MCP server when URL changes
  React.useEffect(() => {
    const connectToMCP = async () => {
      if (!mcpServerUrl || !mcpServerUrl.trim()) {
        // Clear MCP state when URL is empty
        setMcpConnectionStatus(null);
        setMcpTools([]);
        setMcpToolHandlers({});
        if (mcpClient) {
          mcpClient.disconnect();
          setMcpClient(null);
        }
        return;
      }

      try {
        setMcpConnectionStatus('connecting');
        
        // Create new MCP client
        const client = new ImprovedMCPClient(mcpServerUrl);
        const result = await client.connect();
        
        if (result.success) {
          setMcpClient(client);
          setMcpTools(result.tools);
          
          // Create tool handlers
          const handlers = {};
          for (const tool of result.tools) {
            const toolName = tool.function.name;
            handlers[toolName] = async (args) => {
              return await client.callTool(toolName, args);
            };
          }
          setMcpToolHandlers(handlers);
          
          setMcpConnectionStatus('connected');
          console.log('Successfully connected to MCP server:', mcpServerUrl);
        } else {
          setMcpConnectionStatus('error');
          setMcpTools([]);
          setMcpToolHandlers({});
          setMcpClient(null);
          console.error('Failed to connect to MCP server:', result.error);
        }
      } catch (error) {
        console.error('Error connecting to MCP server:', error);
        setMcpConnectionStatus('error');
        setMcpTools([]);
        setMcpToolHandlers({});
        setMcpClient(null);
      }
    };

    // Debounce the connection attempt
    const timeoutId = setTimeout(connectToMCP, 1000);
    return () => clearTimeout(timeoutId);
  }, [mcpServerUrl]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (mcpClient) {
        mcpClient.disconnect();
      }
    };
  }, [mcpClient]);

  return {
    mcpServerUrl,
    setMcpServerUrl,
    mcpConnectionStatus,
    mcpTools,
    mcpToolHandlers,
    mcpClient
  };
};

export default useMCPManager;