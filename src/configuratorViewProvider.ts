import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  CMakeProject,
  ConfigurePreset,
  BuildPreset,
  TestPreset,
  ExtensionState,
  WebviewMessage
} from './types.js';
import { CMakeScanner } from './cmakeScanner.js';
import { PresetManager } from './presetManager.js';
import { CacheParser } from './cacheParser.js';
import { CMakeRunner } from './cmakeRunner.js';
import { CMakeStatusBar } from './statusBar.js';
import { getWebviewContent } from './webview/configuratorHtml.js';

export class ConfiguratorViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'cmake-gui.configuratorView';
  private _view?: vscode.WebviewView;

  private state: ExtensionState = {
    projects: [],
    configurePresets: [],
    buildPresets: [],
    testPresets: [],
    activeTarget: 'all',
    activeConfiguration: 'Debug',
    activeGenerator: 'Ninja',
    availableGenerators: ['Ninja', 'Unix Makefiles', 'Visual Studio 17 2022', 'Xcode'],
    availableConfigurations: ['Debug', 'Release', 'RelWithDebInfo', 'MinSizeRel'],
    buildDir: '',
    cacheEntries: [],
    isProcessRunning: false,
    runInBuiltinTerminal: vscode.workspace.getConfiguration('cmakeGui').get<boolean>('runInTerminal', false)
  };

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly scanner: CMakeScanner,
    private readonly runner: CMakeRunner,
    private readonly statusBar: CMakeStatusBar
  ) {
    this.setupListeners();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri]
    };

    webviewView.webview.html = getWebviewContent(webviewView.webview, this.extensionUri);

    webviewView.webview.onDidReceiveMessage(async (data: WebviewMessage) => {
      await this.handleMessage(data);
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.updateWebviewState();
      }
    });
  }

  private setupListeners(): void {
    // When workspace files change and scanner discovers updates
    this.scanner.onDidProjectsChange(async (projects) => {
      this.state.projects = projects;
      if (!this.getActiveProject() && projects.length > 0) {
        this.selectProject(projects[0].id);
      } else {
        await this.reloadActiveProject();
      }
      this.updateWebviewState();
    });

    // When CMake processes start or emit output
    this.runner.onDidStart((info) => {
      this.state.isProcessRunning = true;
      this.state.currentProcessName = info.name;
      this.state.lastCommand = info.command;
      this.statusBar.update(this.state.activeConfigurePreset, this.state.activeTarget, true);
      this._view?.webview.postMessage({
        type: 'processStart',
        name: info.name,
        command: info.command
      });
    });

    this.runner.onDidOutput((text) => {
      this._view?.webview.postMessage({ type: 'output', text });
    });

    this.runner.onDidFinish((result) => {
      this.state.isProcessRunning = false;
      this.state.lastExitCode = result.exitCode ?? undefined;
      this.statusBar.update(this.state.activeConfigurePreset, this.state.activeTarget, false);
      this._view?.webview.postMessage({ type: 'processEnd', result });

      // Refresh cache entries after configure or build completes
      this.reloadCacheEntries();
      this.updateWebviewState();
    });
  }

  public async initialize(): Promise<void> {
    const projects = await this.scanner.scanWorkspace();
    this.state.projects = projects;
    if (projects.length > 0) {
      await this.selectProject(projects[0].id);
    }
  }

  public getActiveProject(): CMakeProject | undefined {
    return this.state.projects.find(p => p.id === this.state.activeProjectId);
  }

  public async selectProject(projectId: string): Promise<void> {
    this.state.activeProjectId = projectId;
    await this.reloadActiveProject();
  }

  private async reloadActiveProject(): Promise<void> {
    const project = this.getActiveProject();
    if (!project) {
      this.state.configurePresets = [];
      this.state.buildPresets = [];
      this.state.testPresets = [];
      this.state.activeConfigurePreset = undefined;
      this.state.activeBuildPreset = undefined;
      this.state.cacheEntries = [];
      this.updateWebviewState();
      return;
    }

    // Load presets
    const presets = PresetManager.loadPresets(
      project.sourceDir,
      project.presetsPath,
      project.userPresetsPath
    );

    this.state.configurePresets = presets.configurePresets;
    this.state.buildPresets = presets.buildPresets;
    this.state.testPresets = presets.testPresets;

    // Pick active configure preset
    if (this.state.configurePresets.length > 0) {
      if (!this.state.activeConfigurePreset || !this.state.configurePresets.some(p => p.name === this.state.activeConfigurePreset)) {
        this.state.activeConfigurePreset = this.state.configurePresets[0].name;
      }
    } else {
      this.state.activeConfigurePreset = undefined;
    }

    // Pick active build preset
    if (this.state.buildPresets.length > 0) {
      const matchingBuildPresets = this.state.buildPresets.filter(
        b => !b.configurePreset || b.configurePreset === this.state.activeConfigurePreset
      );
      if (matchingBuildPresets.length > 0) {
        this.state.activeBuildPreset = matchingBuildPresets[0].name;
      } else {
        this.state.activeBuildPreset = this.state.buildPresets[0].name;
      }
    } else {
      this.state.activeBuildPreset = undefined;
    }

    // Update target
    if (!project.targets.includes(this.state.activeTarget)) {
      this.state.activeTarget = project.targets[0] || 'all';
    }

    // Determine build directory
    this.updateActiveBuildDir();

    // Reload cache entries
    this.reloadCacheEntries();

    // Update status bar
    this.statusBar.update(this.state.activeConfigurePreset, this.state.activeTarget, this.state.isProcessRunning);

    this.updateWebviewState();
  }

  private updateActiveBuildDir(): void {
    const project = this.getActiveProject();
    if (!project) return;

    if (this.state.activeConfigurePreset) {
      const preset = this.state.configurePresets.find(p => p.name === this.state.activeConfigurePreset);
      if (preset?.binaryDir) {
        this.state.buildDir = preset.binaryDir;
        return;
      }
    }

    this.state.buildDir = path.join(project.sourceDir, 'build');
  }

  private customCacheOverrides: Map<string, { type: string; value: string }> = new Map();

  private reloadCacheEntries(): void {
    const entriesMap = new Map<string, import('./types.js').CMakeCacheEntry>();

    // 1. If active configure preset has cacheVariables, load them first!
    if (this.state.activeConfigurePreset) {
      const preset = this.state.configurePresets.find(p => p.name === this.state.activeConfigurePreset);
      if (preset && preset.cacheVariables) {
        for (const [key, val] of Object.entries(preset.cacheVariables)) {
          let strVal = '';
          let varType: import('./types.js').CMakeCacheEntry['type'] = 'STRING';

          if (typeof val === 'boolean') {
            varType = 'BOOL';
            strVal = val ? 'ON' : 'OFF';
          } else if (typeof val === 'string') {
            varType = (val === 'ON' || val === 'OFF' || val === 'TRUE' || val === 'FALSE') ? 'BOOL' : 'STRING';
            strVal = val;
          } else if (typeof val === 'object' && val !== null) {
            strVal = String((val as any).value ?? '');
            varType = ((val as any).type as import('./types.js').CMakeCacheEntry['type']) || 'STRING';
          }

          entriesMap.set(key, {
            name: key,
            type: varType,
            value: strVal,
            help: `Defined in preset "${preset.name}"`,
            advanced: false
          });
        }
      }
    }

    // 2. If CMakeCache.txt exists on disk, parse and merge
    if (this.state.buildDir) {
      const cacheFile = path.join(this.state.buildDir, 'CMakeCache.txt');
      if (fs.existsSync(cacheFile)) {
        const diskEntries = CacheParser.parse(cacheFile);
        for (const entry of diskEntries) {
          entriesMap.set(entry.name, entry);
        }
      }
    }

    // 3. Overlay any live user modifications
    for (const [key, ov] of this.customCacheOverrides.entries()) {
      const existing = entriesMap.get(key);
      if (existing) {
        existing.value = ov.value;
      } else {
        entriesMap.set(key, {
          name: key,
          type: ov.type as import('./types.js').CMakeCacheEntry['type'],
          value: ov.value,
          help: 'Custom user variable',
          advanced: false
        });
      }
    }

    this.state.cacheEntries = Array.from(entriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }


  private updateWebviewState(): void {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'state',
        state: this.state
      });
    }
  }

  private async handleMessage(data: WebviewMessage): Promise<void> {
    switch (data.command) {
      case 'ready':
        this.updateWebviewState();
        break;

      case 'selectProject':
        await this.selectProject(data.projectId);
        break;

      case 'selectConfigurePreset':
        this.state.activeConfigurePreset = data.presetName;
        this.updateActiveBuildDir();
        this.reloadCacheEntries();
        this.statusBar.update(this.state.activeConfigurePreset, this.state.activeTarget, this.state.isProcessRunning);
        this.updateWebviewState();
        break;

      case 'selectBuildPreset':
        this.state.activeBuildPreset = data.presetName;
        this.updateWebviewState();
        break;

      case 'selectTarget':
        this.state.activeTarget = data.target;
        this.statusBar.update(this.state.activeConfigurePreset, this.state.activeTarget, this.state.isProcessRunning);
        this.updateWebviewState();
        break;

      case 'selectConfiguration':
        this.state.activeConfiguration = data.configuration;
        this.updateWebviewState();
        break;

      case 'selectGenerator':
        this.state.activeGenerator = data.generator;
        this.updateWebviewState();
        break;

      case 'configure':
        await this.runConfigure();
        break;

      case 'build':
        await this.runBuild();
        break;

      case 'clean':
        await this.runClean();
        break;

      case 'test':
        await this.runTest();
        break;

      case 'stop':
        this.runner.stop();
        break;

      case 'refresh':
        const projects = await this.scanner.scanWorkspace();
        this.state.projects = projects;
        await this.reloadActiveProject();
        break;

      case 'scaffoldPresets':
        await this.scaffoldPresets();
        break;

      case 'openTerminal':
        const currentProj = this.getActiveProject();
        this.runner.showOrOpenVsCodeTerminal(currentProj?.sourceDir);
        break;

      case 'setTerminalMode':
        this.state.runInBuiltinTerminal = data.builtin;
        this.updateWebviewState();
        break;

      case 'updateCacheEntry':
      case 'addCacheEntry':
        this.customCacheOverrides.set(data.name, { type: data.type, value: data.value });
        if (this.state.buildDir) {
          const cacheFile = path.join(this.state.buildDir, 'CMakeCache.txt');
          if (fs.existsSync(cacheFile)) {
            CacheParser.updateEntry(cacheFile, data.name, data.type, data.value);
          }
        }
        this.reloadCacheEntries();
        this.updateWebviewState();
        break;
    }
  }

  public async runConfigure(): Promise<void> {
    const project = this.getActiveProject();
    if (!project) {
      vscode.window.showErrorMessage('No active CMake project selected.');
      return;
    }

    const config = vscode.workspace.getConfiguration('cmakeGui');
    const cmakePath = config.get<string>('cmakePath', 'cmake');

    const args: string[] = [];

    if (this.state.activeConfigurePreset) {
      args.push('--preset', this.state.activeConfigurePreset);
    } else {
      args.push('-S', project.sourceDir);
      args.push('-B', this.state.buildDir || path.join(project.sourceDir, 'build'));
      if (this.state.activeGenerator) {
        args.push('-G', `"${this.state.activeGenerator}"`);
      }
      if (this.state.activeConfiguration) {
        args.push(`-DCMAKE_BUILD_TYPE=${this.state.activeConfiguration}`);
      }
    }

    // Append any user-configured cache variable overrides as -D flags
    for (const [key, ov] of this.customCacheOverrides.entries()) {
      args.push(`-D${key}:${ov.type}=${ov.value}`);
    }

    await this.runner.runCommand('Configure', cmakePath, args, project.sourceDir, undefined, this.state.runInBuiltinTerminal);
  }


  public async runBuild(): Promise<void> {
    const project = this.getActiveProject();
    if (!project) {
      vscode.window.showErrorMessage('No active CMake project selected.');
      return;
    }

    const config = vscode.workspace.getConfiguration('cmakeGui');
    const cmakePath = config.get<string>('cmakePath', 'cmake');
    const parallelJobs = config.get<number>('parallelJobs', 0);

    const args: string[] = ['--build'];

    if (this.state.activeBuildPreset) {
      args.push('--preset', this.state.activeBuildPreset);
    } else {
      args.push(this.state.buildDir || path.join(project.sourceDir, 'build'));
    }

    if (this.state.activeTarget && this.state.activeTarget !== 'all') {
      args.push('--target', this.state.activeTarget);
    }

    if (parallelJobs > 0) {
      args.push('--parallel', parallelJobs.toString());
    }

    await this.runner.runCommand('Build', cmakePath, args, project.sourceDir, undefined, this.state.runInBuiltinTerminal);
  }

  public async runClean(): Promise<void> {
    const project = this.getActiveProject();
    if (!project) return;

    const config = vscode.workspace.getConfiguration('cmakeGui');
    const cmakePath = config.get<string>('cmakePath', 'cmake');

    const args = ['--build', this.state.buildDir || path.join(project.sourceDir, 'build'), '--target', 'clean'];
    await this.runner.runCommand('Clean', cmakePath, args, project.sourceDir, undefined, this.state.runInBuiltinTerminal);
  }

  public async runTest(): Promise<void> {
    const project = this.getActiveProject();
    if (!project) return;

    const config = vscode.workspace.getConfiguration('cmakeGui');
    const ctestPath = config.get<string>('ctestPath', 'ctest');

    const args: string[] = [];

    if (this.state.testPresets.length > 0 && this.state.activeConfigurePreset) {
      const matchingTestPreset = this.state.testPresets.find(
        t => t.configurePreset === this.state.activeConfigurePreset
      );
      if (matchingTestPreset) {
        args.push('--preset', matchingTestPreset.name);
      }
    }

    if (args.length === 0) {
      args.push('--test-dir', this.state.buildDir || path.join(project.sourceDir, 'build'));
      args.push('--output-on-failure');
    }

    await this.runner.runCommand('CTest', ctestPath, args, project.sourceDir, undefined, this.state.runInBuiltinTerminal);
  }


  public async scaffoldPresets(): Promise<void> {
    const project = this.getActiveProject();
    if (!project) return;

    const targetFile = path.join(project.sourceDir, 'CMakePresets.json');
    PresetManager.createSamplePresetsFile(targetFile);

    vscode.window.showInformationMessage(`Created ${targetFile}!`);
    const doc = await vscode.workspace.openTextDocument(targetFile);
    await vscode.window.showTextDocument(doc);

    await this.reloadActiveProject();
  }

  public async showConfigurePresetQuickPick(): Promise<void> {
    if (this.state.configurePresets.length === 0) {
      vscode.window.showInformationMessage('No configure presets found in project.');
      return;
    }

    const items: vscode.QuickPickItem[] = this.state.configurePresets.map(p => ({
      label: p.displayName || p.name,
      description: p.name,
      detail: p.description || (p.generator ? `Generator: ${p.generator}` : undefined)
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a CMake Configure Preset'
    });

    if (picked && picked.description) {
      await this.handleMessage({
        command: 'selectConfigurePreset',
        presetName: picked.description
      });
    }
  }

  public async showBuildPresetQuickPick(): Promise<void> {
    if (this.state.buildPresets.length === 0) {
      vscode.window.showInformationMessage('No build presets found in project.');
      return;
    }

    const items: vscode.QuickPickItem[] = this.state.buildPresets.map(p => ({
      label: p.displayName || p.name,
      description: p.name,
      detail: p.description || (p.configurePreset ? `Configure: ${p.configurePreset}` : undefined)
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a CMake Build Preset'
    });

    if (picked && picked.description) {
      await this.handleMessage({
        command: 'selectBuildPreset',
        presetName: picked.description
      });
    }
  }

  public async showTargetQuickPick(): Promise<void> {
    const project = this.getActiveProject();
    const targets = project?.targets || ['all'];

    const items: vscode.QuickPickItem[] = targets.map(t => ({
      label: t,
      description: t === 'all' ? 'Build entire project' : 'Build specific target'
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select Active Build Target'
    });

    if (picked) {
      await this.handleMessage({
        command: 'selectTarget',
        target: picked.label
      });
    }
  }
}

