export interface ConfigurePreset {
  name: string;
  displayName?: string;
  description?: string;
  generator?: string;
  binaryDir?: string;
  installDir?: string;
  cmakeExecutable?: string;
  toolchainFile?: string;
  cacheVariables?: Record<string, string | boolean | { type?: string; value: string | boolean }>;
  environment?: Record<string, string>;
  inherits?: string | string[];
  hidden?: boolean;
}

export interface BuildPreset {
  name: string;
  displayName?: string;
  description?: string;
  configurePreset?: string;
  inheritConfigureEnvironment?: boolean;
  configuration?: string;
  targets?: string | string[];
  jobs?: number;
  cleanFirst?: boolean;
  inherits?: string | string[];
  hidden?: boolean;
}

export interface TestPreset {
  name: string;
  displayName?: string;
  description?: string;
  configurePreset?: string;
  configuration?: string;
  inherits?: string | string[];
  hidden?: boolean;
}

export interface PackagePreset {
  name: string;
  displayName?: string;
  description?: string;
  configurePreset?: string;
  inherits?: string | string[];
  hidden?: boolean;
}

export interface WorkflowStep {
  type: 'configure' | 'build' | 'test' | 'package';
  name: string;
}

export interface WorkflowPreset {
  name: string;
  displayName?: string;
  description?: string;
  steps: WorkflowStep[];
}

export interface CMakePresetsData {
  version: number;
  cmakeMinimumRequired?: {
    major?: number;
    minor?: number;
    patch?: number;
  };
  configurePresets?: ConfigurePreset[];
  buildPresets?: BuildPreset[];
  testPresets?: TestPreset[];
  packagePresets?: PackagePreset[];
  workflowPresets?: WorkflowPreset[];
}

export interface CMakeCacheEntry {
  name: string;
  type: 'BOOL' | 'STRING' | 'PATH' | 'FILEPATH' | 'INTERNAL' | 'STATIC' | 'UNINITIALIZED';
  value: string;
  help: string;
  advanced: boolean;
}

export interface CMakeProject {
  id: string;
  name: string;
  rootUri: string;
  sourceDir: string;
  cmakeListsPath: string;
  hasPresetsFile: boolean;
  presetsPath?: string;
  userPresetsPath?: string;
  buildDir?: string;
  cachePath?: string;
  targets: string[];
}

export interface ExtensionState {
  projects: CMakeProject[];
  activeProjectId?: string;
  configurePresets: ConfigurePreset[];
  buildPresets: BuildPreset[];
  testPresets: TestPreset[];
  activeConfigurePreset?: string;
  activeBuildPreset?: string;
  activeTestPreset?: string;
  activeTarget: string;
  activeConfiguration: string;
  activeGenerator?: string;
  availableGenerators: string[];
  availableConfigurations: string[];
  buildDir: string;
  cacheEntries: CMakeCacheEntry[];
  isProcessRunning: boolean;
  currentProcessName?: string;
  lastCommand?: string;
  lastExitCode?: number;
}

export type WebviewMessage =
  | { command: 'ready' }
  | { command: 'selectProject'; projectId: string }
  | { command: 'selectConfigurePreset'; presetName: string }
  | { command: 'selectBuildPreset'; presetName: string }
  | { command: 'selectTestPreset'; presetName: string }
  | { command: 'selectTarget'; target: string }
  | { command: 'selectConfiguration'; configuration: string }
  | { command: 'selectGenerator'; generator: string }
  | { command: 'setBuildDir'; buildDir: string }
  | { command: 'configure' }
  | { command: 'build' }
  | { command: 'clean' }
  | { command: 'test' }
  | { command: 'stop' }
  | { command: 'refresh' }
  | { command: 'openFile'; filePath: string }
  | { command: 'scaffoldPresets' }
  | { command: 'updateCacheEntry'; name: string; value: string; type: string }
  | { command: 'addCacheEntry'; name: string; value: string; type: string };

