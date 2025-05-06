import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';

// Register file-related tools with the MCP server
export function registerFileTools(server: McpServer) {
    // Write content to a file
    server.tool(
        'write_file',
        {
            filePath: z.string().describe('Absolute path to the file to write'),
            content: z.string().describe('Content to write to the file')
        },
        async ({ filePath, content }) => {
            try {
                // Create directory if it doesn't exist
                const dirPath = path.dirname(filePath);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }

                // Write the file
                fs.writeFileSync(filePath, content);

                return {
                    content: [{ type: 'text', text: `File written successfully: ${filePath}` }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error writing file: ${error.message}` }]
                };
            }
        }
    );

    // Read content from a file
    server.tool(
        'read_file',
        {
            filePath: z.string().describe('Absolute path to the file to read')
        },
        async ({ filePath }) => {
            try {
                if (!fs.existsSync(filePath)) {
                    return {
                        content: [{ type: 'text', text: `File not found: ${filePath}` }]
                    };
                }

                const content = fs.readFileSync(filePath, 'utf8');

                return {
                    content: [{ type: 'text', text: `File content:\n${content}` }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error reading file: ${error.message}` }]
                };
            }
        }
    );
}