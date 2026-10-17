import * as vscode from 'vscode';
import { CMakeScanner } from './cmakeScanner.js';
import { CMakeRunner } from './cmakeRunner.js';
import { CMakeStatusBar } from './statusBar.js';
import { ConfiguratorViewProvider } from './configuratorViewProvider.js';

let scanner: CMakeScanner | undefined;
let runner: CMakeRunner | undefined;
let statusBar: CMakeStatusBar | undefined;
let provider: ConfiguratorViewProvider | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('[CMake GUI] Activating CMake Configurator & Build Panel Extension...');

  // 1. Initialize services
  scanner = new CMakeScanner();
  runner = new CMakeRunner();
  statusBar = new CMakeStatusBar();
  provider = new ConfiguratorViewProvider(context.extensionUri, scanner, runner, statusBar);

  // 2. Register Webview Provider
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ConfiguratorViewProvider.viewType,
      provider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    )
  );

  // 3. Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('cmake-gui.scanProject', async () => {
      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Scanning workspace for CMake projects...'
        },
        async () => {
          await provider?.initialize();
          vscode.window.showInformationMessage('CMake workspace scan complete.');
        }
      );
    }),

    vscode.commands.registerCommand('cmake-gui.openPanel', () => {
      vscode.commands.executeCommand('workbench.view.extension.cmake-gui-sidebar');
    }),

    vscode.commands.registerCommand('cmake-gui.configure', async () => {
      await provider?.runConfigure();
    }),

    vscode.commands.registerCommand('cmake-gui.build', async () => {
      await provider?.runBuild();
    }),

    vscode.commands.registerCommand('cmake-gui.clean', async () => {
      await provider?.runClean();
    }),

    vscode.commands.registerCommand('cmake-gui.test', async () => {
      await provider?.runTest();
    }),

    vscode.commands.registerCommand('cmake-gui.stop', () => {
      runner?.stop();
    }),

    vscode.commands.registerCommand('cmake-gui.selectConfigurePreset', async () => {
      await provider?.showConfigurePresetQuickPick();
    }),

    vscode.commands.registerCommand('cmake-gui.selectBuildPreset', async () => {
      await provider?.showBuildPresetQuickPick();
    }),

    vscode.commands.registerCommand('cmake-gui.selectTarget', async () => {
      await provider?.showTargetQuickPick();
    }),

    vscode.commands.registerCommand('cmake-gui.createSamplePresets', async () => {
      await provider?.scaffoldPresets();
    })
  );

  context.subscriptions.push(scanner, runner, statusBar);

  // 4. Perform initial scan
  const config = vscode.workspace.getConfiguration('cmakeGui');
  if (config.get<boolean>('autoScanOnOpen', true)) {
    await provider.initialize();
  }

  console.log('[CMake GUI] CMake Configurator & Build Panel Extension is ready!');
}

export function deactivate(): void {
  scanner?.dispose();
  runner?.dispose();
  statusBar?.dispose();
}

