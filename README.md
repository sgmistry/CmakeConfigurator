# CMake Configurator & Build Panel for VS Code

A modern, intuitive, and GUI-driven VS Code extension for CMake-based C/C++ projects. Automatically scans your workspace for CMake projects, parses `CMakePresets.json`, and provides a rich sidebar panel with dropdown preset selectors, quick build actions, cache configurator, and live streaming output.

---

## ✨ Features

- **Automatic Workspace Scanning**:
  - Automatically discovers all `CMakeLists.txt`, `CMakePresets.json`, and `CMakeUserPresets.json` files in the workspace.
  - Multi-root and multi-project support with easy switching.
  - Automatically parses defined targets (`add_executable`, `add_library`) and makes them selectable in dropdowns.

- **Dropdown Preset & Target Selectors**:
  - **Configure Preset Selector**: Switch between Debug, Release, Ninja, Makefiles, MSVC, or custom presets with a single click.
  - **Build Preset Selector**: Automatically filters build presets matching the selected configure preset.
  - **Target Selector**: Choose to build `all`, `clean`, or specific executables and libraries.
  - **Build Type & Generator Selectors**: Direct dropdown fallback for projects without `CMakePresets.json`.

- **GUI CMake Configurator (Cache Variable Manager)**:
  - View and edit cached variables from `CMakeCache.txt`.
  - Filter by Booleans, Strings, Paths, and Advanced options.
  - Toggle boolean flags directly with interactive switches.
  - Add and override `-D<VAR>:<TYPE>=<VAL>` variables directly from the UI without manual command line typing.

- **One-Click Build & Process Actions**:
  - ⚡ **Configure**: Runs CMake configuration with selected preset or arguments.
  - 🔨 **Build**: Builds active target or entire project with parallel compilation support.
  - 🧹 **Clean**: Cleans build artifacts and targets.
  - 🧪 **Test**: Runs CTest tests with preset support and instant failure reporting.
  - ⏹️ **Cancel**: Safely terminates any active CMake process.

- **Status Bar Integration**:
  - Live indicators in the VS Code status bar showing active Configure Preset and Target.
  - Quick pickers directly from status bar items.

- **Scaffold Starter Presets**:
  - One-click generation of modern `CMakePresets.json` (v6) if your project doesn't have one yet.

---

## 🚀 Quick Start

1. Install the extension (`cmake-gui-builder-1.0.0.vsix` or from extensions panel).
2. Open any workspace containing a CMake project (e.g. `sample-project`).
3. Click the **CMake** icon in the VS Code Activity Bar (left sidebar).
4. Select your desired **Configure Preset** and **Build Target** from the dropdowns.
5. Click **⚡ Configure** and **🔨 Build**!

---

## 🛠️ Extension Commands

| Command | Title |
|---|---|
| `cmake-gui.openPanel` | Open Configurator & Build Panel |
| `cmake-gui.scanProject` | Scan Project & Reload Presets |
| `cmake-gui.configure` | Configure Project |
| `cmake-gui.build` | Build Active Target |
| `cmake-gui.clean` | Clean Build |
| `cmake-gui.test` | Run CTest |
| `cmake-gui.stop` | Stop Current Process |
| `cmake-gui.selectConfigurePreset` | Quick Pick Configure Preset |
| `cmake-gui.selectBuildPreset` | Quick Pick Build Preset |
| `cmake-gui.selectTarget` | Quick Pick Build Target |
| `cmake-gui.createSamplePresets` | Scaffold starter CMakePresets.json |

---

## ⚙️ Configuration Settings

- `cmakeGui.cmakePath`: Path to the `cmake` executable (default: `"cmake"`).
- `cmakeGui.ctestPath`: Path to the `ctest` executable (default: `"ctest"`).
- `cmakeGui.autoScanOnOpen`: Automatically scan workspace on open (default: `true`).
- `cmakeGui.runInTerminal`: Run commands in integrated terminal instead of Output Channel (default: `false`).
- `cmakeGui.parallelJobs`: Number of parallel jobs for building (default: `0` for auto-detect).
