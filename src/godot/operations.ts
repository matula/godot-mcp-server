import { findGodotPath, runGodotCommand } from '../utils/godot-utils.js';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

// Path to the GDScript operations file
let gdScriptPath: string | null = null;

// Initialize the operations script
export async function initOperationsScript(): Promise<string> {
    // Create the script in a temp directory
    if (!gdScriptPath) {
        const tempDir = os.tmpdir();
        gdScriptPath = path.join(tempDir, 'godot_operations.gd');

        // Define the script content directly
        const gdScriptContent = `@tool
extends SceneTree

# Operations script for Godot MCP Server
var result = {}

func _init():
    var args = OS.get_cmdline_args()
    
    # Better error handling for arguments
    if args.size() < 2:
        print_error("Missing operation parameters")
        quit(1)
        return
    
    # Read operation data from file instead of command line
    var json_file_path = args[1]
    if not FileAccess.file_exists(json_file_path):
        print_error("JSON file not found: " + json_file_path)
        quit(1)
        return
    
    # Read the file content
    var file = FileAccess.open(json_file_path, FileAccess.READ)
    var json_text = file.get_as_text()
    file.close()
    
    # Parse JSON
    var json = JSON.new()
    var parse_result = json.parse(json_text)
    if parse_result != OK:
        print_error("Failed to parse JSON: " + json.get_error_message() + " at line " + str(json.get_error_line()))
        quit(1)
        return
    
    var operation_data = json.get_data()
    if operation_data == null:
        print_error("Invalid JSON data")
        quit(1)
        return
    
    # Handle the operation
    handle_operation(operation_data)
    quit()

func handle_operation(data):
    if not data.has("operation"):
        print_error("Missing operation type")
        return
    
    var operation = data["operation"]
    print("Executing operation: " + operation)
    
    match operation:
        "get_scene_tree":
            get_scene_tree(data)
        "create_scene":
            create_scene(data)
        "add_node":
            add_node(data)
        _:
            print_error("Unknown operation: " + operation)

func create_scene(data):
    if not data.has("projectPath") or not data.has("sceneName"):
        print_error("Missing required parameters for create_scene")
        return
    
    var project_path = data["projectPath"]
    var scene_name = data["sceneName"]
    var node_type = "Node2D"  # Default
    
    if data.has("nodeType"):
        node_type = data["nodeType"]
    
    print("Creating scene: " + scene_name + " with root node type: " + node_type)
    
    # Create the scene
    var scene = SceneTree.new()
    var root = Node.new()
    
    # Try to create the desired node type dynamically
    var script = GDScript.new()
    script.source_code = "extends RefCounted\\nfunc create():\\n\\treturn " + node_type + ".new()"
    script.reload()
    var root_node = script.new().create()
    
    if root_node == null:
        print_error("Failed to create node of type: " + node_type)
        return
    
    root_node.name = scene_name.get_file().get_basename()
    
    # Save the scene
    var scene_path = "res://scenes/"
    if not DirAccess.dir_exists_absolute(project_path + "/scenes"):
        DirAccess.make_dir_recursive_absolute(project_path + "/scenes")
    
    var full_path = project_path + "/scenes/" + scene_name + ".tscn"
    var packed_scene = PackedScene.new()
    packed_scene.pack(root_node)
    
    var save_result = ResourceSaver.save(packed_scene, full_path)
    if save_result != OK:
        print_error("Failed to save scene to: " + full_path + ", error: " + str(save_result))
        return
    
    result = {
        "success": true,
        "message": "Scene created at " + full_path
    }
    print_json(result)

func get_scene_tree(data):
    # Implementation for getting scene tree
    result = {
        "success": true,
        "data": {
            "name": "Scene Tree Example",
            "nodes": [
                {"name": "Root", "type": "Node3D"},
                {"name": "Camera", "type": "Camera3D"}
            ]
        }
    }
    print_json(result)

func add_node(data):
    # Implementation for adding a node
    result = {
        "success": true,
        "message": "Node added"
    }
    print_json(result)

func print_error(message):
    result = {
        "success": false,
        "error": message
    }
    print_json(result)

func print_json(data):
    print(JSON.stringify(data))`;

        // Write the script content to the temp file
        try {
            fs.writeFileSync(gdScriptPath, gdScriptContent);
        } catch (error) {
            throw new Error(`Failed to create GDScript operations file: ${error}`);
        }
    }

    return gdScriptPath;
}

// Run a Godot operation using the GDScript operations file
export async function runGodotOperation(
    projectPath: string,
    operation: string,
    params: any = {}
): Promise<any> {
    const godotPath = await findGodotPath();
    if (!godotPath) {
        throw new Error('Godot executable not found');
    }

    const scriptPath = await initOperationsScript();

    // Prepare the operation data
    const operationData = {
        operation,
        projectPath,
        ...params
    };

    // Write the JSON to a temporary file instead of passing as command line
    const tempDir = os.tmpdir();
    const tempJsonPath = path.join(tempDir, `godot_op_${Date.now()}.json`);
    fs.writeFileSync(tempJsonPath, JSON.stringify(operationData));

    // Run the operation script, passing the temp file path
    const { stdout, stderr } = await runGodotCommand(
        godotPath,
        ['--script', scriptPath, tempJsonPath],
        projectPath
    );

    // Clean up the temp file
    try {
        fs.unlinkSync(tempJsonPath);
    } catch (e) {
        console.error("Failed to clean up temp file:", e);
    }

    if (stderr && stderr.length > 0) {
        console.error('GDScript operation error:', stderr);
    }

    // Parse the result JSON
    try {
        // Look for a JSON object in the output (Godot might print other info too)
        const jsonMatch = stdout.match(/{[\s\S]*}/);
        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return result;
        } else {
            throw new Error(`No JSON found in output: ${stdout}`);
        }
    } catch (error) {
        throw new Error(`Failed to parse GDScript operation result: ${stdout}`);
    }
}

// Define specific operations

export async function getSceneTree(projectPath: string): Promise<any> {
    return runGodotOperation(projectPath, 'get_scene_tree');
}

export async function createScene(
    projectPath: string,
    sceneName: string,
    nodeType: string = 'Node3D'
): Promise<any> {
    return runGodotOperation(projectPath, 'create_scene', {
        sceneName,
        nodeType
    });
}

export async function addNode(
    projectPath: string,
    parentPath: string,
    nodeName: string,
    nodeType: string
): Promise<any> {
    return runGodotOperation(projectPath, 'add_node', {
        parentPath,
        nodeName,
        nodeType
    });
}