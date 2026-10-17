import * as fs from 'fs';
import * as path from 'path';
import {
  CMakePresetsData,
  ConfigurePreset,
  BuildPreset,
  TestPreset,
  PackagePreset,
  WorkflowPreset
} from './types.js';

export class PresetManager {
  /**
   * Load presets from CMakePresets.json and optionally CMakeUserPresets.json
   */
  public static loadPresets(
    sourceDir: string,
    presetsPath?: string,
    userPresetsPath?: string
  ): {
    configurePresets: ConfigurePreset[];
    buildPresets: BuildPreset[];
    testPresets: TestPreset[];
    packagePresets: PackagePreset[];
    workflowPresets: WorkflowPreset[];
  } {
    const mainPresetsFile = presetsPath || path.join(sourceDir, 'CMakePresets.json');
    const userPresetsFile = userPresetsPath || path.join(sourceDir, 'CMakeUserPresets.json');

    const configMap = new Map<string, ConfigurePreset>();
    const buildMap = new Map<string, BuildPreset>();
    const testMap = new Map<string, TestPreset>();
    const packageMap = new Map<string, PackagePreset>();
    const workflowMap = new Map<string, WorkflowPreset>();

    // 1. Load main presets file
    if (fs.existsSync(mainPresetsFile)) {
      try {
        const raw = fs.readFileSync(mainPresetsFile, 'utf8');
        const data: CMakePresetsData = JSON.parse(raw);
        this.collectPresets(data, configMap, buildMap, testMap, packageMap, workflowMap);
      } catch (e) {
        console.error(`Failed to parse ${mainPresetsFile}:`, e);
      }
    }

    // 2. Load user presets file (overrides or extends)
    if (fs.existsSync(userPresetsFile)) {
      try {
        const raw = fs.readFileSync(userPresetsFile, 'utf8');
        const data: CMakePresetsData = JSON.parse(raw);
        this.collectPresets(data, configMap, buildMap, testMap, packageMap, workflowMap);
      } catch (e) {
        console.error(`Failed to parse ${userPresetsFile}:`, e);
      }
    }

    // 3. Resolve inheritance for configure presets
    const resolvedConfigurePresets = this.resolveInheritance(Array.from(configMap.values()), configMap);
    const resolvedBuildPresets = this.resolveInheritance(Array.from(buildMap.values()), buildMap);
    const resolvedTestPresets = this.resolveInheritance(Array.from(testMap.values()), testMap);

    // 4. Resolve macro substitutions
    const expandedConfigurePresets = resolvedConfigurePresets.map(p =>
      this.expandConfigureMacros(p, sourceDir)
    );

    return {
      configurePresets: expandedConfigurePresets.filter(p => !p.hidden),
      buildPresets: resolvedBuildPresets.filter(p => !p.hidden),
      testPresets: resolvedTestPresets.filter(p => !p.hidden),
      packagePresets: Array.from(packageMap.values()).filter(p => !p.hidden),
      workflowPresets: Array.from(workflowMap.values())
    };
  }

  private static collectPresets(
    data: CMakePresetsData,
    configMap: Map<string, ConfigurePreset>,
    buildMap: Map<string, BuildPreset>,
    testMap: Map<string, TestPreset>,
    packageMap: Map<string, PackagePreset>,
    workflowMap: Map<string, WorkflowPreset>
  ) {
    if (data.configurePresets) {
      for (const p of data.configurePresets) {
        if (p.name) {
          configMap.set(p.name, p);
        }
      }
    }
    if (data.buildPresets) {
      for (const p of data.buildPresets) {
        if (p.name) {
          buildMap.set(p.name, p);
        }
      }
    }
    if (data.testPresets) {
      for (const p of data.testPresets) {
        if (p.name) {
          testMap.set(p.name, p);
        }
      }
    }
    if (data.packagePresets) {
      for (const p of data.packagePresets) {
        if (p.name) {
          packageMap.set(p.name, p);
        }
      }
    }
    if (data.workflowPresets) {
      for (const p of data.workflowPresets) {
        if (p.name) {
          workflowMap.set(p.name, p);
        }
      }
    }
  }

  private static resolveInheritance<T extends { name: string; inherits?: string | string[] }>(
    presets: T[],
    map: Map<string, T>
  ): T[] {
    return presets.map(preset => {
      if (!preset.inherits) {
        return preset;
      }
      const parents = Array.isArray(preset.inherits) ? preset.inherits : [preset.inherits];
      let merged: any = {};
      for (const parentName of parents) {
        const parent = map.get(parentName);
        if (parent) {
          merged = { ...merged, ...parent };
        }
      }
      return { ...merged, ...preset };
    });
  }

  /**
   * Expand macros like ${sourceDir}, ${presetName}, ${generator} in binaryDir
   */
  public static expandConfigureMacros(preset: ConfigurePreset, sourceDir: string): ConfigurePreset {
    const copy = { ...preset };
    if (copy.binaryDir) {
      let bDir = copy.binaryDir;
      bDir = bDir.replace(/\$\{sourceDir\}/g, sourceDir);
      bDir = bDir.replace(/\$\{presetName\}/g, preset.name);
      bDir = bDir.replace(/\$\{generator\}/g, preset.generator || 'default');
      bDir = bDir.replace(/\$\{sourceParentDir\}/g, path.dirname(sourceDir));
      copy.binaryDir = path.isAbsolute(bDir) ? path.normalize(bDir) : path.normalize(path.join(sourceDir, bDir));
    } else {
      // Default CMake build directory convention
      copy.binaryDir = path.join(sourceDir, 'build', preset.name);
    }
    return copy;
  }

  /**
   * Generate a starter CMakePresets.json if the user does not have one
   */
  public static createSamplePresetsFile(targetFilePath: string): void {
    const defaultData: CMakePresetsData = {
      version: 6,
      cmakeMinimumRequired: {
        major: 3,
        minor: 23,
        patch: 0
      },
      configurePresets: [
        {
          name: "ninja-debug",
          displayName: "Ninja Debug",
          description: "Debug build using Ninja generator",
          generator: "Ninja",
          binaryDir: "${sourceDir}/build/${presetName}",
          cacheVariables: {
            "CMAKE_BUILD_TYPE": "Debug",
            "CMAKE_EXPORT_COMPILE_COMMANDS": "ON"
          }
        },
        {
          name: "ninja-release",
          displayName: "Ninja Release",
          description: "Optimized Release build using Ninja generator",
          generator: "Ninja",
          binaryDir: "${sourceDir}/build/${presetName}",
          cacheVariables: {
            "CMAKE_BUILD_TYPE": "Release",
            "CMAKE_EXPORT_COMPILE_COMMANDS": "ON"
          }
        },
        {
          name: "make-debug",
          displayName: "Unix Makefiles Debug",
          description: "Debug build using Unix Makefiles",
          generator: "Unix Makefiles",
          binaryDir: "${sourceDir}/build/${presetName}",
          cacheVariables: {
            "CMAKE_BUILD_TYPE": "Debug",
            "CMAKE_EXPORT_COMPILE_COMMANDS": "ON"
          }
        },
        {
          name: "make-release",
          displayName: "Unix Makefiles Release",
          description: "Release build using Unix Makefiles",
          generator: "Unix Makefiles",
          binaryDir: "${sourceDir}/build/${presetName}",
          cacheVariables: {
            "CMAKE_BUILD_TYPE": "Release",
            "CMAKE_EXPORT_COMPILE_COMMANDS": "ON"
          }
        }
      ],
      buildPresets: [
        {
          name: "build-ninja-debug",
          displayName: "Build Ninja Debug",
          configurePreset: "ninja-debug"
        },
        {
          name: "build-ninja-release",
          displayName: "Build Ninja Release",
          configurePreset: "ninja-release"
        },
        {
          name: "build-make-debug",
          displayName: "Build Make Debug",
          configurePreset: "make-debug"
        },
        {
          name: "build-make-release",
          displayName: "Build Make Release",
          configurePreset: "make-release"
        }
      ],
      testPresets: [
        {
          name: "test-ninja-debug",
          displayName: "Test Ninja Debug",
          configurePreset: "ninja-debug"
        },
        {
          name: "test-ninja-release",
          displayName: "Test Ninja Release",
          configurePreset: "ninja-release"
        }
      ]
    };

    fs.writeFileSync(targetFilePath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

