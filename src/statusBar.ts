import * as vscode from 'vscode';

export class CMakeStatusBar {
  private presetItem: vscode.StatusBarItem;
  private targetItem: vscode.StatusBarItem;
  private buildItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor() {
    // Preset Selector item
    this.presetItem = vscode.window.createStatusBarItem(
      'cmakeGui.preset',
      vscode.StatusBarAlignment.Left,
      100
    );
    this.presetItem.command = 'cmake-gui.selectConfigurePreset';
    this.presetItem.tooltip = 'Click to switch CMake Configure Preset';

    // Target item
    this.targetItem = vscode.window.createStatusBarItem(
      'cmakeGui.target',
      vscode.StatusBarAlignment.Left,
      99
    );
    this.targetItem.command = 'cmake-gui.selectTarget';
    this.targetItem.tooltip = 'Click to switch Active Build Target';

    // Build item
    this.buildItem = vscode.window.createStatusBarItem(
      'cmakeGui.build',
      vscode.StatusBarAlignment.Left,
      98
    );
    this.buildItem.command = 'cmake-gui.build';
    this.buildItem.text = '$(tools) Build';
    this.buildItem.tooltip = 'Click to Build Active CMake Target';

    this.disposables.push(this.presetItem, this.targetItem, this.buildItem);
  }

  public update(configurePreset?: string, target?: string, isRunning?: boolean): void {
    if (isRunning) {
      this.presetItem.text = `$(sync~spin) CMake: Running...`;
      this.presetItem.show();
      this.targetItem.hide();
      this.buildItem.text = '$(primitive-square) Stop';
      this.buildItem.command = 'cmake-gui.stop';
      this.buildItem.show();
      return;
    }

    this.buildItem.text = '$(tools) Build';
    this.buildItem.command = 'cmake-gui.build';

    if (configurePreset) {
      this.presetItem.text = `$(gear) CMake: ${configurePreset}`;
      this.presetItem.show();
    } else {
      this.presetItem.text = `$(gear) CMake: (No Preset)`;
      this.presetItem.show();
    }

    if (target) {
      this.targetItem.text = `$(target) [${target}]`;
      this.targetItem.show();
    } else {
      this.targetItem.hide();
    }

    this.buildItem.show();
  }

  public hide(): void {
    this.presetItem.hide();
    this.targetItem.hide();
    this.buildItem.hide();
  }

  public dispose(): void {
    this.disposables.forEach(d => d.dispose());
  }
}

