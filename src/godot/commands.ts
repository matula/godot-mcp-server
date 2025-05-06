import { findGodotPath, runGodotCommand, isGodotProject } from '../utils/godot-utils.js';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

let godotPath: string | null = null;
let godotProcess: any = null;

// Initialize the Godot path
export async function initGodot(): Promise<string> {
    if (!godotPath) {
        godotPath = await findGodotPath();
        if (!godotPath) {
            throw new Error('Godot executable not found. Set GODOT_PATH environment variable to your Godot executable.');
        }
    }
    return godotPath;
}

// Get Godot version
export async function getGodotVersion(): Promise<string> {
    const godotPath = await initGodot();
    const { stdout } = await runGodotCommand(godotPath, ['--version']);
    return stdout.trim();
}

// Launch Godot editor for a project
export async function launchEditor(projectPath: string): Promise<string> {
    const godotPath = await initGodot();

    if (!await isGodotProject(projectPath)) {
        throw new Error(`Invalid Godot project path: ${projectPath}`);
    }

    // Launch editor in a separate process
    const process = spawn(godotPath, ['--editor', '--path', projectPath], {
        detached: true,
        stdio: 'ignore'
    });

    // Let the process run independently of the parent
    process.unref();

    return `Launched Godot editor for project: ${projectPath}`;
}

// List Godot projects in a directory
export async function listProjects(directoryPath: string): Promise<string[]> {
    try {
        const entries = await fs.promises.readdir(directoryPath, { withFileTypes: true });
        const projects = [];

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const projectPath = path.join(directoryPath, entry.name);
                if (await isGodotProject(projectPath)) {
                    projects.push(projectPath);
                }
            }
        }

        return projects;
    } catch (error) {
        throw new Error(`Failed to list Godot projects: ${error}`);
    }
}

// Create a new Godot project
export async function createProject(
    parentDirectory: string,
    projectName: string,
    template: string = "3d"
): Promise<string> {
    const godotPath = await initGodot();

    // Create the project directory
    const projectPath = path.join(parentDirectory, projectName);

    // Check if directory already exists
    if (fs.existsSync(projectPath)) {
        throw new Error(`Directory already exists: ${projectPath}`);
    }

    // Create the project directory
    fs.mkdirSync(projectPath, { recursive: true });

    // Create basic project structure
    fs.mkdirSync(path.join(projectPath, 'scenes'), { recursive: true });
    fs.mkdirSync(path.join(projectPath, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(projectPath, 'assets'), { recursive: true });

    // Create project.godot file with basic settings
    const projectConfig =
        `; Engine configuration file.
; It's best edited using the editor UI and not directly,
; since the parameters that go here are not all obvious.
;
; Format:
;   [section] ; section goes between []
;   param=value ; assign values to parameters

config_version=5

[application]

config/name="${projectName}"
config/features=PackedStringArray("4.4")
config/icon="res://icon.svg"

[rendering]

renderer/rendering_method="gl_compatibility"
renderer/rendering_method.mobile="gl_compatibility"
`;

    fs.writeFileSync(path.join(projectPath, 'project.godot'), projectConfig);

    // Add default icon
    const iconSvg =
        `<svg height="128" width="128" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="124" height="124" rx="14" fill="#363d52" stroke="#212532" stroke-width="4"/>
  <circle cx="64" cy="64" r="42" fill="#478cbf"/>
</svg>`;

    fs.writeFileSync(path.join(projectPath, 'icon.svg'), iconSvg);

    // Create a default scene if it's a 3D or 2D project
    if (template === "3d" || template === "2d") {
        const sceneType = template === "3d" ? "Node3D" : "Node2D";
        const scenePath = path.join(projectPath, 'scenes', 'Main.tscn');

        // Create a minimal scene file
        const sceneContent =
            `[gd_scene format=3 uid="uid://bvip5r7kng6y7"]

[node name="Main" type="${sceneType}"]
`;

        fs.writeFileSync(scenePath, sceneContent);
    }

    return `Created new Godot project at: ${projectPath}`;
}

// Run a Godot project
export async function runProject(projectPath: string): Promise<string> {
    const godotPath = await initGodot();

    if (!await isGodotProject(projectPath)) {
        throw new Error(`Invalid Godot project path: ${projectPath}`);
    }

    // If a project is already running, stop it first
    if (godotProcess) {
        await stopProject();
    }

    // Launch the project
    godotProcess = spawn(godotPath, ['--path', projectPath], {
        stdio: ['ignore', 'pipe', 'pipe']
    });

    // Capture output
    let output = '';
    godotProcess.stdout.on('data', (data: Buffer) => {
        output += data.toString();
    });

    godotProcess.stderr.on('data', (data: Buffer) => {
        output += data.toString();
    });

    return `Running Godot project: ${projectPath}`;
}

// Stop running project
export async function stopProject(): Promise<string> {
    if (!godotProcess) {
        return 'No Godot project is currently running';
    }

    godotProcess.kill();
    godotProcess = null;

    return 'Stopped running Godot project';
}

// Get debug output from the running project
export async function getDebugOutput(): Promise<string> {
    if (!godotProcess) {
        return 'No Godot project is currently running';
    }

    // We would read from the stdout/stderr channels that we've been capturing
    // This is a placeholder - in a real implementation, you'd need to manage this better
    return 'Debug output would be shown here';
}