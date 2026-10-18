# CMake Project Configuration/Build Helper for VS Code

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/samir.cmake-gui-builder?label=Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=samir.cmake-gui-builder)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![VS Code Engine](https://img.shields.io/badge/VS%20Code-%3E%3D%201.85.0-blue)](https://code.visualstudio.com/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-sgmistry%2FCmakeConfigurator-181717?logo=github)](https://github.com/sgmistry/CmakeConfigurator)

A modern, fast, and visual **CMake Configurator & Build Panel** for VS Code. Automatically scans your workspace for CMake projects, parses `CMakePresets.json`, and provides an intuitive GUI with **dropdown preset selectors**, **interactive cache variable toggles**, and a **live embedded terminal**.

---

## ✨ Why CMake Project Configuration/Build Helper?

Working with CMake on complex projects often requires remembering long CLI flags, navigating nested build folders, or manually editing `CMakeCache.txt`. 

This extension brings a clean, modern GUI right to your VS Code Activity Bar:
- 🏷️ **Select Presets via Dropdowns**: Switch between Debug, Release, Ninja, Makefiles, MSVC, or custom presets with a single click.
- 🎯 **Target Picker**: Choose to build `all`, `clean`, or specific executables and libraries discovered automatically.
- ⚙️ **GUI Cache Configurator**: Toggle boolean flags with switches, edit paths, and add `-D` definitions without typing commands.
- 🖥️ **Dual Terminal Output**: Watch builds live in the plugin panel with ANSI colors, or switch to VS Code's native bottom terminal with one toggle.
- 🔄 **Live Workspace Sync**: Automatically refreshes whenever you edit `CMakeLists.txt` or `CMakePresets.json`.

---

## 🚀 Key Features

### 1. 🔍 Automatic Workspace Scanner
- Recursively searches for all `CMakeLists.txt`, `CMakePresets.json`, and `CMakeUserPresets.json` files across your workspace.
- Detects executables and library targets (`add_executable`, `add_library`) and populates target dropdowns automatically.
- Supports mono-repos and multi-project workspaces with a quick project switcher.
- Automatically excludes `build/`, `out/`, `node_modules/`, and `.git/` directories for optimal performance.

### 2. 🏷️ Dropdown Preset & Target Selectors
- **Configure Preset Selector**: Displays configure presets with badges, descriptions, and resolved macro expansions (`${sourceDir}`, `${presetName}`, `${generator}`).
- **Build Preset Selector**: Intelligently filters build presets associated with your active configure preset.
- **Target Selector**: Pick `all`, `clean`, or any individual build target.
- **Custom Mode Fallback**: For projects without presets, allows selecting build type (`Debug`, `Release`, etc.) and generator (`Ninja`, `Unix Makefiles`, etc.), with a 1-click button to scaffold a starter `CMakePresets.json`.

### 3. ⚙️ Interactive GUI CMake Configurator (Cache Manager)
- Reads configuration variables from active presets and `CMakeCache.txt`.
- **Interactive Controls**:
  - Boolean variables (`BOOL`) render as instant interactive toggle switches (`ON` / `OFF`).
  - Path and string variables render with editable text inputs.
- **Filter & Search**: Quick search bar with filter pills (**All**, **Booleans**, **Paths**, **Strings**, **Show Advanced**).
- **Add / Override Variables**: Easily add `-D<VAR>:<TYPE>=<VALUE>` definitions from the GUI.

### 4. ⚡ One-Click Action Buttons
- ⚡ **Configure**: Runs CMake configuration with selected preset or custom definitions.
- 🔨 **Build**: Compiles selected target or entire project (supports parallel compilation).
- 🧹 **Clean**: Invokes clean build targets.
- 🧪 **Test**: Runs CTest test suite with preset support.
- ⏹️ **Cancel**: Safely terminates running processes at any time.

### 5. 🖥️ Dual Terminal Integration
- **Embedded Plugin Terminal**:
  - Live streaming build output directly below the Action buttons.
  - Full **ANSI color highlights** (green for success, red for errors, yellow for warnings, cyan for commands).
  - Status indicator dot (animated blue when running, green on success, red on failure).
  - Live execution timer (e.g. `(1.4s)`) and exit code reporting.
  - Toolbar with **Clear**, **Copy to Clipboard**, and **VS Code Terminal** popout.
- **VS Code Built-in Terminal Mode**:
  - Select `"Execute in: 🖥️ VS Code Terminal"` to run commands directly inside VS Code's native bottom terminal panel.

### 6. 📊 Status Bar Integration
- Status bar items display the active configure preset `$(gear) CMake: [preset]` and active target `$(target) [target]`.
- Clicking either item opens a quick-pick switcher.

---

## 🏁 Quick Start

1. Install **CMake Project Configuration/Build Helper** from the VS Code Marketplace.
2. Open any folder or workspace containing a `CMakeLists.txt` or `CMakePresets.json`.
3. Click the **CMake** icon in the Activity Bar (left sidebar).
4. Select your **Configure Preset** and **Build Target** from the dropdowns.
5. Click **⚡ Configure** and **🔨 Build**!

> 💡 **No Presets Yet?** Click the **"Scaffold CMakePresets.json"** button inside the panel to generate a standard, multi-platform `CMakePresets.json` (v6) file instantly!

---

## ⚙️ Extension Settings

| Setting | Type | Default | Description |
|---|---|---|---|
| `cmakeGui.cmakePath` | `string` | `"cmake"` | Path to the `cmake` executable |
| `cmakeGui.ctestPath` | `string` | `"ctest"` | Path to the `ctest` executable |
| `cmakeGui.autoScanOnOpen` | `boolean` | `true` | Automatically scan workspace for CMake projects when opened |
| `cmakeGui.runInTerminal` | `boolean` | `false` | Run CMake commands in the integrated bottom terminal by default |
| `cmakeGui.parallelJobs` | `number` | `0` | Number of parallel jobs for build (`0` = auto-detect CPU cores) |

---

## 🛠️ Available Commands

Access these commands via the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Title |
|---|---|
| `cmake-gui.openPanel` | **CMake: Open Configurator & Build Panel** |
| `cmake-gui.scanProject` | **CMake: Scan Project & Reload Presets** |
| `cmake-gui.configure` | **CMake: Configure Project** |
| `cmake-gui.build` | **CMake: Build Active Target** |
| `cmake-gui.clean` | **CMake: Clean Build** |
| `cmake-gui.test` | **CMake: Run CTest** |
| `cmake-gui.stop` | **CMake: Stop Current Process** |
| `cmake-gui.selectConfigurePreset` | **CMake: Select Configure Preset** |
| `cmake-gui.selectBuildPreset` | **CMake: Select Build Preset** |
| `cmake-gui.selectTarget` | **CMake: Select Build Target** |
| `cmake-gui.createSamplePresets` | **CMake: Scaffold CMakePresets.json** |

---

## 📦 Building from Source

To build and package the extension locally:

```bash
# 1. Clone repository
git clone https://github.com/sgmistry/CmakeConfigurator.git
cd CmakeConfigurator

# 2. Install dependencies
npm install

# 3. Compile and bundle
npm run compile
npm run bundle

# 4. Run tests
node test/runTests.cjs

# 5. Package into .vsix
npx @vscode/vsce package --no-git-tag-version --allow-missing-repository
```

---

## 📄 License

This extension is open-source software licensed under the [MIT License](https://github.com/sgmistry/CmakeConfigurator/blob/main/LICENSE).

---

## ⚖️ Trademarks & Disclaimers

- **CMake** is a registered trademark of [Kitware, Inc.](https://www.kitware.com/). This extension is an independent community project and is not affiliated with, endorsed by, or sponsored by Kitware, Inc.
- **Visual Studio Code** and **VS Code** are trademarks of [Microsoft Corporation](https://www.microsoft.com/).
- All other trademarks and logos are property of their respective owners.
