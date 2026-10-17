import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { CMakeProject } from './types.js';

export class CMakeScanner {
  private watcher: vscode.FileSystemWatcher | undefined;
  private onDidProjectsChangeEmitter = new vscode.EventEmitter<CMakeProject[]>();
  public readonly onDidProjectsChange = this.onDidProjectsChangeEmitter.event;

  constructor() {
    this.setupWatchers();
  }

  /**
   * Set up file system watchers for CMakeLists.txt and CMakePresets.json
   */
  private setupWatchers(): void {
    this.watcher = vscode.workspace.createFileSystemWatcher(
      '**/{CMakeLists.txt,CMakePresets.json,CMakeUserPresets.json,CMakeCache.txt}'
    );

    const triggerRefresh = () => {
      // Debounce slightly
      setTimeout(async () => {
        const projects = await this.scanWorkspace();
        this.onDidProjectsChangeEmitter.fire(projects);
      }, 300);
    };

    this.watcher.onDidCreate(triggerRefresh);
    this.watcher.onDidChange(triggerRefresh);
    this.watcher.onDidDelete(triggerRefresh);
  }

  /**
   * Scan the workspace for all CMake projects
   */
  public async scanWorkspace(): Promise<CMakeProject[]> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return [];
    }

    const projects: CMakeProject[] = [];

    // Find all CMakeLists.txt excluding typical build and cache directories
    const cmakeFiles = await vscode.workspace.findFiles(
      '**/CMakeLists.txt',
      '{**/node_modules/**,**/.git/**,**/build/**,**/out/**,**/.cache/**,**/.vscode/**}'
    );

    for (const fileUri of cmakeFiles) {
      const cmakeListsPath = fileUri.fsPath;
      const sourceDir = path.dirname(cmakeListsPath);
      const rootFolder = vscode.workspace.getWorkspaceFolder(fileUri);
      const rootUri = rootFolder ? rootFolder.uri.fsPath : sourceDir;

      // Extract project name from CMakeLists.txt or fallback to folder name
      const projectName = this.extractProjectName(cmakeListsPath) || path.basename(sourceDir);

      // Check for presets
      const presetsPath = path.join(sourceDir, 'CMakePresets.json');
      const userPresetsPath = path.join(sourceDir, 'CMakeUserPresets.json');
      const hasPresetsFile = fs.existsSync(presetsPath) || fs.existsSync(userPresetsPath);

      // Extract defined targets (executables & libraries)
      const targets = this.extractTargets(cmakeListsPath);

      // Look for candidate build directory
      const buildDir = this.findBuildDirectory(sourceDir);
      const cachePath = buildDir ? path.join(buildDir, 'CMakeCache.txt') : undefined;

      const project: CMakeProject = {
        id: Buffer.from(sourceDir).toString('base64url'),
        name: projectName,
        rootUri,
        sourceDir,
        cmakeListsPath,
        hasPresetsFile,
        presetsPath: fs.existsSync(presetsPath) ? presetsPath : undefined,
        userPresetsPath: fs.existsSync(userPresetsPath) ? userPresetsPath : undefined,
        buildDir,
        cachePath: cachePath && fs.existsSync(cachePath) ? cachePath : undefined,
        targets: ['all', ...targets]
      };

      projects.push(project);
    }

    // Sort projects so root-most projects appear first
    projects.sort((a, b) => a.sourceDir.length - b.sourceDir.length);

    return projects;
  }

  /**
   * Extract project name from project(...) command in CMakeLists.txt
   */
  private extractProjectName(cmakeListsPath: string): string | undefined {
    try {
      const content = fs.readFileSync(cmakeListsPath, 'utf8');
      const match = content.match(/project\s*\(\s*([a-zA-Z0-9_\-]+)/i);
      if (match && match[1]) {
        return match[1];
      }
    } catch {
      // Ignore
    }
    return undefined;
  }

  /**
   * Parse add_executable(...) and add_library(...) to find build targets
   */
  private extractTargets(cmakeListsPath: string): string[] {
    const targets = new Set<string>();
    try {
      const content = fs.readFileSync(cmakeListsPath, 'utf8');

      // Match add_executable(targetName ...)
      const execMatches = content.matchAll(/add_executable\s*\(\s*([a-zA-Z0-9_\-]+)/gi);
      for (const m of execMatches) {
        if (m[1]) {
          targets.add(m[1]);
        }
      }

      // Match add_library(targetName ...)
      const libMatches = content.matchAll(/add_library\s*\(\s*([a-zA-Z0-9_\-]+)/gi);
      for (const m of libMatches) {
        if (m[1]) {
          targets.add(m[1]);
        }
      }
    } catch {
      // Ignore
    }
    return Array.from(targets);
  }

  /**
   * Detect existing build directories (e.g. build, out)
   */
  private findBuildDirectory(sourceDir: string): string | undefined {
    const candidates = [
      path.join(sourceDir, 'build'),
      path.join(sourceDir, 'out'),
      path.join(sourceDir, 'build', 'debug'),
      path.join(sourceDir, 'build', 'release')
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) {
        return cand;
      }
    }

    return path.join(sourceDir, 'build');
  }

  public dispose(): void {
    if (this.watcher) {
      this.watcher.dispose();
    }
    this.onDidProjectsChangeEmitter.dispose();
  }
}

