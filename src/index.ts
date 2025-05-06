import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGodotTools } from './tools/godot-tools.js';
import { registerFileTools } from './tools/file-tools.js';

// Create the MCP server
const server = new McpServer({
    name: "Godot MCP Server",
    version: "0.1.0"
});

// Register all tools
registerGodotTools(server);
registerFileTools(server);

// Start the server with STDIO transport (for Claude and other clients)
const transport = new StdioServerTransport();

// Connect and start listening
await server.connect(transport);
console.error("Godot MCP Server running...");