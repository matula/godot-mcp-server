import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

// Godot executable paths by platform
const GODOT_PATHS = {
    darwin: [
        '/Applications/Godot.app/Contents/MacOS/Godot',
        '/Applications/Godot_4.app/Contents/MacOS/Godot',
        '/Applications/Godot_4.2.app/Contents/MacOS/Godot',
        // Add custom paths for Mac
    ],
    linux: [
        '/usr/bin/godot',
        '/usr/local/bin/godot',
        // Custom Linux paths here
    ],
    win32: [
        'C:\\Program Files\\Godot\\Godot.exe',
        'C:\\Program Files (x86)\\Godot\\Godot.exe',
        // Custom Windows paths here
    ]
};

// Find Godot executable
export async function findGodotPath(): Promise<string | null> {
    // Check environment variable first
    if (process.env.GODOT_PATH) {
        if (fs.existsSync(process.env.GODOT_PATH)) {
            return process.env.GODOT_PATH;
        }
    }

    // Check platform-specific paths
    const platform = os.platform() as 'darwin' | 'linux' | 'win32';
    const potentialPaths = GODOT_PATHS[platform] || [];

    for (const path of potentialPaths) {
        if (fs.existsSync(path)) {
            return path;
        }
    }

    // Try to find via command line (which godot)
    try {
        if (platform !== 'win32') {
            const { stdout } = await execAsync('which godot');
            const godotPath = stdout.trim();
            if (godotPath && fs.existsSync(godotPath)) {
                return godotPath;
            }
        }
    } catch (error) {
        // Command failed, continue with search
    }

    return null;
}

// Run a Godot command and return the output
export async function runGodotCommand(
    godotPath: string,
    args: string[],
    cwd?: string
): Promise<{ stdout: string; stderr: string }> {
    try {
        return await execAsync(`"${godotPath}" ${args.join(' ')}`, { cwd });
    } catch (error: any) {
        if (error.stdout || error.stderr) {
            return {
                stdout: error.stdout || '',
                stderr: error.stderr || ''
            };
        }
        throw error;
    }
}

// Check if a path is a valid Godot project
export async function isGodotProject(projectPath: string): Promise<boolean> {
    try {
        const projectFile = path.join(projectPath, 'project.godot');
        return fs.existsSync(projectFile);
    } catch (error) {
        return false;
    }
}