import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';

export interface ProcessRunResult {
  exitCode: number | null;
  command: string;
}

export class CMakeRunner {
  private outputChannel: vscode.OutputChannel;
  private currentProcess: ChildProcess | null = null;
  private currentCommandString: string = '';

  private onDidStartEmitter = new vscode.EventEmitter<{ name: string; command: string }>();
  public readonly onDidStart = this.onDidStartEmitter.event;

  private onDidOutputEmitter = new vscode.EventEmitter<string>();
  public readonly onDidOutput = this.onDidOutputEmitter.event;

  private onDidFinishEmitter = new vscode.EventEmitter<ProcessRunResult>();
  public readonly onDidFinish = this.onDidFinishEmitter.event;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('CMake Configurator & Build');
  }

  public get isRunning(): boolean {
    return this.currentProcess !== null;
  }

  public get lastCommand(): string {
    return this.currentCommandString;
  }

  /**
   * Run a CMake or CTest command asynchronously with streaming output
   */
  public async runCommand(
    commandName: string,
    executable: string,
    args: string[],
    cwd: string,
    env?: NodeJS.ProcessEnv
  ): Promise<ProcessRunResult> {
    if (this.isRunning) {
      vscode.window.showWarningMessage('A CMake process is already running. Please cancel it first.');
      return { exitCode: -1, command: this.currentCommandString };
    }

    const config = vscode.workspace.getConfiguration('cmakeGui');
    const runInTerminal = config.get<boolean>('runInTerminal', false);

    const fullCommand = `${executable} ${args.join(' ')}`;
    this.currentCommandString = fullCommand;

    if (runInTerminal) {
      return this.runInVsCodeTerminal(commandName, fullCommand, cwd);
    }

    this.outputChannel.show(true);
    this.log(`\n======================================================`);
    this.log(`[CMake GUI] Starting: ${commandName}`);
    this.log(`[CMake GUI] Command : ${fullCommand}`);
    this.log(`[CMake GUI] Working : ${cwd}`);
    this.log(`======================================================\n`);

    this.onDidStartEmitter.fire({ name: commandName, command: fullCommand });

    return new Promise<ProcessRunResult>((resolve) => {
      try {
        const mergedEnv = {
          ...process.env,
          ...env
        };

        const proc = spawn(executable, args, {
          cwd,
          env: mergedEnv,
          shell: true
        });

        this.currentProcess = proc;

        proc.stdout?.on('data', (data: Buffer) => {
          const text = data.toString();
          this.outputChannel.append(text);
          this.onDidOutputEmitter.fire(text);
        });

        proc.stderr?.on('data', (data: Buffer) => {
          const text = data.toString();
          this.outputChannel.append(text);
          this.onDidOutputEmitter.fire(text);
        });

        proc.on('close', (code: number | null) => {
          this.currentProcess = null;
          const statusText = code === 0 ? 'COMPLETED SUCCESSFULLY' : `FAILED with code ${code}`;
          this.log(`\n[CMake GUI] ${commandName} ${statusText}\n`);

          const result: ProcessRunResult = { exitCode: code, command: fullCommand };
          this.onDidFinishEmitter.fire(result);
          resolve(result);
        });

        proc.on('error', (err) => {
          this.currentProcess = null;
          this.log(`\n[CMake GUI] Process error: ${err.message}\n`);
          vscode.window.showErrorMessage(`Failed to run CMake: ${err.message}`);
          const result: ProcessRunResult = { exitCode: -1, command: fullCommand };
          this.onDidFinishEmitter.fire(result);
          resolve(result);
        });
      } catch (err: any) {
        this.currentProcess = null;
        this.log(`\n[CMake GUI] Execution failed: ${err?.message || err}\n`);
        const result: ProcessRunResult = { exitCode: -1, command: fullCommand };
        this.onDidFinishEmitter.fire(result);
        resolve(result);
      }
    });
  }

  /**
   * Run the command in an integrated VS Code terminal
   */
  private runInVsCodeTerminal(name: string, command: string, cwd: string): Promise<ProcessRunResult> {
    const term = vscode.window.createTerminal({
      name: `CMake: ${name}`,
      cwd
    });
    term.show(true);
    term.sendText(command);
    this.onDidStartEmitter.fire({ name, command });
    this.onDidFinishEmitter.fire({ exitCode: 0, command });
    return Promise.resolve({ exitCode: 0, command });
  }

  private sharedTerminal: vscode.Terminal | null = null;

  public showOrOpenVsCodeTerminal(cwd?: string): void {
    if (!this.sharedTerminal || this.sharedTerminal.exitStatus !== undefined) {
      this.sharedTerminal = vscode.window.createTerminal({
        name: 'CMake Terminal',
        cwd
      });
    }
    this.sharedTerminal.show(true);
  }


  /**
   * Stop the running process
   */

  public stop(): boolean {
    if (this.currentProcess) {
      this.log('\n[CMake GUI] Terminating process...\n');
      try {
        this.currentProcess.kill('SIGTERM');
        setTimeout(() => {
          if (this.currentProcess) {
            this.currentProcess.kill('SIGKILL');
          }
        }, 2000);
        return true;
      } catch (e) {
        console.error('Failed to kill process:', e);
      }
    }
    return false;
  }

  private log(message: string): void {
    this.outputChannel.appendLine(message);
    this.onDidOutputEmitter.fire(message + '\n');
  }

  public showOutput(): void {
    this.outputChannel.show(true);
  }

  public dispose(): void {
    this.stop();
    this.outputChannel.dispose();
    this.onDidStartEmitter.dispose();
    this.onDidOutputEmitter.dispose();
    this.onDidFinishEmitter.dispose();
  }
}

