import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as commands from '../godot/commands.js';
import * as operations from '../godot/operations.js';
import * as path from 'path';
import * as fs from 'fs';

// Register all Godot tools with the MCP server
export function registerGodotTools(server: McpServer) {
    // Get Godot version
    server.tool(
        'godot_version',
        {},
        async () => {
            try {
                const version = await commands.getGodotVersion();
                return {
                    content: [{ type: 'text', text: `Godot version: ${version}` }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error: ${error.message}` }]
                };
            }
        }
    );

    // Launch the Godot editor
    server.tool(
        'launch_editor',
        {
            projectPath: z.string().describe('Absolute path to the Godot project directory')
        },
        async ({ projectPath }) => {
            try {
                const result = await commands.launchEditor(projectPath);
                return {
                    content: [{ type: 'text', text: result }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error launching editor: ${error.message}` }]
                };
            }
        }
    );

    // List Godot projects in a directory
    server.tool(
        'list_projects',
        {
            directoryPath: z.string().describe('Directory to search for Godot projects')
        },
        async ({ directoryPath }) => {
            try {
                const projects = await commands.listProjects(directoryPath);
                const projectsList = projects.join('\n');
                return {
                    content: [{
                        type: 'text',
                        text: projects.length > 0
                            ? `Found ${projects.length} Godot projects:\n${projectsList}`
                            : 'No Godot projects found in the specified directory'
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error listing projects: ${error.message}` }]
                };
            }
        }
    );

    // Create a new Godot project
    server.tool(
        'create_project',
        {
            parentDirectory: z.string().describe('Directory to create the project in'),
            projectName: z.string().describe('Name of the project to create'),
            template: z.enum(["3d", "2d", "empty"]).optional().describe('Project template (3d, 2d, or empty)')
        },
        async ({ parentDirectory, projectName, template = "3d" }) => {
            try {
                const result = await commands.createProject(parentDirectory, projectName, template);
                return {
                    content: [{ type: 'text', text: result }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error creating project: ${error.message}` }]
                };
            }
        }
    );

    // Run a Godot project
    server.tool(
        'run_project',
        {
            projectPath: z.string().describe('Absolute path to the Godot project directory')
        },
        async ({ projectPath }) => {
            try {
                const result = await commands.runProject(projectPath);
                return {
                    content: [{ type: 'text', text: result }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error running project: ${error.message}` }]
                };
            }
        }
    );

    // Stop running project
    server.tool(
        'stop_project',
        {},
        async () => {
            try {
                const result = await commands.stopProject();
                return {
                    content: [{ type: 'text', text: result }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error stopping project: ${error.message}` }]
                };
            }
        }
    );

    // Get debug output
    server.tool(
        'get_debug_output',
        {},
        async () => {
            try {
                const output = await commands.getDebugOutput();
                return {
                    content: [{ type: 'text', text: output }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error getting debug output: ${error.message}` }]
                };
            }
        }
    );

    // Get scene tree
    server.tool(
        'get_scene_tree',
        {
            projectPath: z.string().describe('Absolute path to the Godot project directory')
        },
        async ({ projectPath }) => {
            try {
                const result = await operations.getSceneTree(projectPath);
                return {
                    content: [{
                        type: 'text',
                        text: result.success
                            ? `Scene tree:\n${JSON.stringify(result.data, null, 2)}`
                            : `Error: ${result.error}`
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error getting scene tree: ${error.message}` }]
                };
            }
        }
    );

    // Create a scene
    server.tool(
        'create_scene',
        {
            projectPath: z.string().describe('Absolute path to the Godot project directory'),
            sceneName: z.string().describe('Name of the scene to create'),
            nodeType: z.string().optional().describe('Type of the root node (default: Node3D)')
        },
        async ({ projectPath, sceneName, nodeType }) => {
            try {
                const result = await operations.createScene(projectPath, sceneName, nodeType);
                return {
                    content: [{
                        type: 'text',
                        text: result.success
                            ? `Scene created: ${result.message}`
                            : `Error: ${result.error}`
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error creating scene: ${error.message}` }]
                };
            }
        }
    );

    // Add a node
    server.tool(
        'add_node',
        {
            projectPath: z.string().describe('Absolute path to the Godot project directory'),
            parentPath: z.string().describe('Path to the parent node'),
            nodeName: z.string().describe('Name of the node to add'),
            nodeType: z.string().describe('Type of the node')
        },
        async ({ projectPath, parentPath, nodeName, nodeType }) => {
            try {
                const result = await operations.addNode(projectPath, parentPath, nodeName, nodeType);
                return {
                    content: [{
                        type: 'text',
                        text: result.success
                            ? `Node added: ${result.message}`
                            : `Error: ${result.error}`
                    }]
                };
            } catch (error: any) {
                return {
                    content: [{ type: 'text', text: `Error adding node: ${error.message}` }]
                };
            }
        }
    );
}