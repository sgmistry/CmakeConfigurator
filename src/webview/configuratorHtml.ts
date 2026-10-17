import * as vscode from 'vscode';

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline' 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CMake Project Configuration/Build Helper</title>
  <style>

    :root {
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --border-radius: 4px;
      --control-height: 28px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: var(--vscode-font-family, var(--font-family));
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-foreground);
      background-color: var(--vscode-sideBar-background, var(--vscode-editor-background));
      padding: 12px;
      overflow-x: hidden;
    }

    /* Tabs */
    .tab-nav {
      display: flex;
      border-bottom: 1px solid var(--vscode-panel-border, #333);
      margin-bottom: 12px;
      gap: 4px;
    }

    .tab-btn {
      background: none;
      border: none;
      color: var(--vscode-descriptionForeground);
      padding: 7px 10px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      color: var(--vscode-foreground);
    }

    .tab-btn.active {
      color: var(--vscode-panelTitle-activeForeground, #ffffff);
      border-bottom: 2px solid var(--vscode-panelTitle-activeBorder, var(--vscode-focusBorder));
    }

    .tab-pane {
      display: none;
    }

    .tab-pane.active {
      display: block;
    }

    /* Sections and Field Groups */
    .section {
      margin-bottom: 14px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .field-group {
      margin-bottom: 10px;
    }

    .field-label {
      display: block;
      font-size: 12px;
      margin-bottom: 4px;
      color: var(--vscode-foreground);
      font-weight: 500;
    }

    .field-desc {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 2px;
    }

    /* Form Controls */
    select, input[type="text"] {
      width: 100%;
      height: var(--control-height);
      background: var(--vscode-dropdown-background, var(--vscode-input-background));
      color: var(--vscode-dropdown-foreground, var(--vscode-input-foreground));
      border: 1px solid var(--vscode-dropdown-border, var(--vscode-input-border, #444));
      border-radius: var(--border-radius);
      padding: 2px 8px;
      font-family: inherit;
      font-size: 12px;
      outline: none;
    }

    select:focus, input[type="text"]:focus {
      border-color: var(--vscode-focusBorder);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 12px;
      border: 1px solid transparent;
      border-radius: var(--border-radius);
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      transition: opacity 0.15s, background-color 0.15s;
    }

    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .btn-secondary {
      background: var(--vscode-button-secondaryBackground, #3a3d41);
      color: var(--vscode-button-secondaryForeground, #fff);
    }

    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground, #45494e);
    }

    .btn-danger {
      background: var(--vscode-errorForeground, #d9534f);
      color: #fff;
    }

    .btn-block {
      width: 100%;
      grid-column: span 2;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Summary Card */
    .info-card {
      background: var(--vscode-editor-inactiveSelectionBackground, rgba(128, 128, 128, 0.1));
      border: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.2));
      border-radius: var(--border-radius);
      padding: 10px;
      font-size: 11px;
      margin-bottom: 12px;
    }

    .info-row {
      display: flex;
      margin-bottom: 4px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .info-key {
      width: 85px;
      font-weight: 600;
      color: var(--vscode-descriptionForeground);
      flex-shrink: 0;
    }

    .info-val {
      color: var(--vscode-foreground);
      word-break: break-all;
      font-family: var(--vscode-editor-font-family, monospace);
    }

    .status-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .status-ready { background: rgba(40, 167, 69, 0.2); color: #4cd964; }
    .status-running { background: rgba(0, 122, 255, 0.2); color: #5ac8fa; }
    .status-error { background: rgba(255, 59, 48, 0.2); color: #ff3b30; }

    /* REAL TERMINAL VIEW */
    .terminal-card {
      background: var(--vscode-terminal-background, #121212);
      border: 1px solid var(--vscode-widget-border, #2a2a2a);
      border-radius: var(--border-radius);
      margin-bottom: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .terminal-header {
      background: var(--vscode-sideBarSectionHeader-background, #1e1e1e);
      border-bottom: 1px solid var(--vscode-widget-border, #2a2a2a);
      padding: 6px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      user-select: none;
    }

    .terminal-title {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 11px;
      font-weight: 600;
      color: var(--vscode-foreground);
    }

    .term-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
      transition: background 0.3s;
    }

    .term-dot.idle { background: #6e7681; }
    .term-dot.running {
      background: #58a6ff;
      box-shadow: 0 0 6px #58a6ff;
      animation: pulse-dot 1.2s infinite;
    }
    .term-dot.success { background: #3fb950; box-shadow: 0 0 4px #3fb950; }
    .term-dot.error { background: #f85149; box-shadow: 0 0 4px #f85149; }

    @keyframes pulse-dot {
      0% { transform: scale(0.9); opacity: 0.7; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.7; }
    }

    .terminal-toolbar {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .term-tool-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--vscode-descriptionForeground);
      font-size: 10px;
      font-weight: 500;
      padding: 2px 6px;
      border-radius: 3px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      transition: all 0.15s ease;
    }

    .term-tool-btn:hover {
      background: var(--vscode-toolbar-hoverBackground, rgba(255, 255, 255, 0.1));
      color: var(--vscode-foreground);
      border-color: var(--vscode-widget-border, #444);
    }

    .terminal-viewport {
      font-family: var(--vscode-editor-font-family, Consolas, "Courier New", monospace);
      font-size: 11px;
      line-height: 1.45;
      color: var(--vscode-terminal-foreground, #d4d4d4);
      padding: 10px;
      height: 220px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      background: var(--vscode-terminal-background, #121212);
    }

    .terminal-prompt-line {
      color: var(--vscode-terminal-ansiCyan, #56b6c2);
      font-weight: bold;
      margin-bottom: 4px;
    }

    .terminal-status-footer {
      background: var(--vscode-sideBarSectionHeader-background, #1a1a1a);
      border-top: 1px solid var(--vscode-widget-border, #2a2a2a);
      padding: 4px 10px;
      font-size: 10px;
      display: flex;
      justify-content: space-between;
      color: var(--vscode-descriptionForeground);
    }

    /* CACHE CONFIGURATOR STYLES */
    .cache-filter-bar {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
    }

    .cache-filter-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 10px;
    }

    .filter-pill {
      background: var(--vscode-badge-background, #333);
      color: var(--vscode-badge-foreground, #ccc);
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 10px;
      cursor: pointer;
      user-select: none;
      border: 1px solid transparent;
    }

    .filter-pill.active {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .cache-list {
      max-height: 380px;
      overflow-y: auto;
      border: 1px solid var(--vscode-widget-border, #333);
      border-radius: var(--border-radius);
      background: var(--vscode-editor-background);
    }

    .cache-item {
      padding: 8px 10px;
      border-bottom: 1px solid var(--vscode-widget-border, #222);
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .cache-item:last-child {
      border-bottom: none;
    }

    .cache-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cache-name {
      font-weight: 600;
      font-size: 11px;
      color: var(--vscode-symbolIcon-variableForeground, #9cdcfe);
      word-break: break-all;
    }

    .cache-type {
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 3px;
      background: var(--vscode-badge-background, #222);
      color: var(--vscode-badge-foreground, #aaa);
      font-weight: 600;
    }

    .cache-help {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.3;
    }

    .toggle-container {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: 24px 12px;
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>

  <!-- Tab Navigation -->
  <div class="tab-nav">
    <button class="tab-btn active" data-tab="build" id="tab-btn-build">Build & Presets</button>
    <button class="tab-btn" data-tab="cache" id="tab-btn-cache">Configurator</button>
    <button class="tab-btn" data-tab="terminal" id="tab-btn-terminal">Logs & Terminal</button>
  </div>

  <!-- TAB 1: Build & Presets -->
  <div id="tab-build" class="tab-pane active">

    <!-- Project Selector -->
    <div class="field-group" id="project-group">
      <label class="field-label" for="project-select">Active CMake Project</label>
      <select id="project-select"></select>
    </div>

    <!-- Configure Preset Dropdown -->
    <div class="field-group">
      <label class="field-label" for="configure-preset-select">
        Configure Preset
        <span id="preset-count" style="float: right; color: var(--vscode-descriptionForeground); font-weight: normal; font-size: 10px;"></span>
      </label>
      <select id="configure-preset-select"></select>
      <div class="field-desc" id="configure-preset-desc">Select a preset from CMakePresets.json</div>
    </div>

    <!-- Build Preset Dropdown -->
    <div class="field-group">
      <label class="field-label" for="build-preset-select">Build Preset</label>
      <select id="build-preset-select"></select>
    </div>

    <!-- Target Dropdown -->
    <div class="field-group">
      <label class="field-label" for="target-select">Build Target</label>
      <select id="target-select"></select>
    </div>

    <!-- Fallback config fields -->
    <div id="custom-config-fields" style="display: none;">
      <div class="field-group">
        <label class="field-label" for="config-select">Build Type</label>
        <select id="config-select">
          <option value="Debug">Debug</option>
          <option value="Release">Release</option>
          <option value="RelWithDebInfo">RelWithDebInfo</option>
          <option value="MinSizeRel">MinSizeRel</option>
        </select>
      </div>

      <div class="field-group">
        <label class="field-label" for="generator-select">Generator</label>
        <select id="generator-select">
          <option value="Ninja">Ninja</option>
          <option value="Unix Makefiles">Unix Makefiles</option>
          <option value="Visual Studio 17 2022">Visual Studio 17 2022</option>
        </select>
      </div>
    </div>

    <!-- Execution Target Switcher -->
    <div style="margin-bottom: 12px; padding: 6px 10px; background: var(--vscode-editor-inactiveSelectionBackground, rgba(128,128,128,0.1)); border-radius: var(--border-radius); border: 1px solid var(--vscode-widget-border, #333); display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 11px; font-weight: 600;">Execute in:</span>
      <div style="display: flex; gap: 4px;">
        <button id="mode-plugin-btn" class="term-tool-btn" style="padding: 3px 8px; border-radius: 10px; font-weight: 600;">Plugin View</button>
        <button id="mode-builtin-btn" class="term-tool-btn" style="padding: 3px 8px; border-radius: 10px; font-weight: 600;">🖥️ VS Code Terminal</button>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="section">
      <div class="section-title">
        <span>Actions</span>
        <span id="process-badge" class="status-badge status-ready">Ready</span>
      </div>

      <div class="actions-grid">
        <button id="btn-configure" class="btn btn-primary">⚡ Configure</button>
        <button id="btn-build" class="btn btn-primary">🔨 Build</button>
        <button id="btn-clean" class="btn btn-secondary">🧹 Clean</button>
        <button id="btn-test" class="btn btn-secondary">🧪 Test</button>
        <button id="btn-stop" class="btn btn-danger btn-block" style="display: none;">⏹️ Cancel Process</button>
      </div>
    </div>

    <!-- EMBEDDED TERMINAL VIEW ON PLUGIN -->
    <div class="terminal-card" id="plugin-terminal-card">
      <div class="terminal-header">
        <div class="terminal-title">
          <span id="term-status-dot" class="term-dot idle"></span>
          <span id="term-title-text">Terminal Output</span>
          <span id="term-timer" style="font-weight: normal; font-size: 10px; opacity: 0.8;"></span>
        </div>
        <div class="terminal-toolbar">
          <button class="term-tool-btn" id="btn-term-clear" title="Clear terminal">🧹 Clear</button>
          <button class="term-tool-btn" id="btn-term-copy" title="Copy output">📋 Copy</button>
          <button class="term-tool-btn" id="btn-term-vscode" title="Open VS Code bottom terminal">🖥️ Terminal</button>
        </div>
      </div>
      <div id="plugin-terminal-body" class="terminal-viewport">
        <div class="terminal-prompt-line">$ cmake-gui ready. Select preset and click Configure or Build.</div>
      </div>
      <div class="terminal-status-footer">
        <span id="term-footer-status">Ready</span>
        <span id="term-footer-cmd">Waiting for command...</span>
      </div>
    </div>

    <!-- Current Configuration Summary -->
    <div class="section">
      <div class="section-title">Summary & Paths</div>
      <div class="info-card">
        <div class="info-row">
          <span class="info-key">Source Dir:</span>
          <span class="info-val" id="summary-source-dir">-</span>
        </div>
        <div class="info-row">
          <span class="info-key">Build Dir:</span>
          <span class="info-val" id="summary-build-dir">-</span>
        </div>
        <div class="info-row">
          <span class="info-key">Command:</span>
          <span class="info-val" id="summary-command">-</span>
        </div>
      </div>
    </div>

    <!-- Empty presets scaffold card -->
    <div id="no-presets-card" style="display: none;" class="info-card">
      <div style="font-weight: 600; margin-bottom: 6px;">No CMakePresets.json Found</div>
      <div style="margin-bottom: 8px; color: var(--vscode-descriptionForeground);">
        CMakePresets.json allows sharing build configurations across your team and tools.
      </div>
      <button class="btn btn-secondary btn-block" id="btn-scaffold-presets">Scaffold CMakePresets.json</button>
    </div>

  </div>

  <!-- TAB 2: CMake Configurator (Cache Variables) -->
  <div id="tab-cache" class="tab-pane">
    <div class="field-group">
      <div class="cache-filter-bar">
        <input type="text" id="cache-search" placeholder="Filter variables...">
      </div>
      <div class="cache-filter-pills">
        <span class="filter-pill active" data-filter="ALL" id="pill-all">All</span>
        <span class="filter-pill" data-filter="BOOL" id="pill-bool">Booleans</span>
        <span class="filter-pill" data-filter="PATH" id="pill-path">Paths</span>
        <span class="filter-pill" data-filter="STRING" id="pill-string">Strings</span>
        <span class="filter-pill" id="pill-advanced">Show Advanced</span>
      </div>
    </div>

    <div id="cache-list" class="cache-list"></div>

    <!-- Add Variable section -->
    <div class="section" style="margin-top: 14px;">
      <div class="section-title">Add / Override Variable</div>
      <div style="display: flex; gap: 4px; margin-bottom: 6px;">
        <input type="text" id="new-var-name" placeholder="VARIABLE_NAME" style="flex: 2;">
        <select id="new-var-type" style="flex: 1;">
          <option value="BOOL">BOOL</option>
          <option value="STRING">STRING</option>
          <option value="PATH">PATH</option>
          <option value="FILEPATH">FILEPATH</option>
        </select>
      </div>
      <div style="display: flex; gap: 4px;">
        <input type="text" id="new-var-value" placeholder="Value (e.g. ON, /path/to/dir)" style="flex: 3;">
        <button class="btn btn-secondary" id="btn-add-cache-var" style="flex: 1;">Add</button>
      </div>
    </div>
  </div>

  <!-- TAB 3: Dedicated Full Terminal View -->
  <div id="tab-terminal" class="tab-pane">
    <div class="terminal-card" style="height: calc(100vh - 65px);">
      <div class="terminal-header">
        <div class="terminal-title">
          <span id="full-term-status-dot" class="term-dot idle"></span>
          <span>Full Terminal Console</span>
        </div>
        <div class="terminal-toolbar">
          <button class="term-tool-btn" id="btn-full-term-clear">🧹 Clear</button>
          <button class="term-tool-btn" id="btn-full-term-copy">📋 Copy</button>
          <button class="term-tool-btn" id="btn-full-term-vscode">🖥️ VS Code Terminal</button>
        </div>
      </div>
      <div id="full-terminal-body" class="terminal-viewport" style="height: 100%;">
        <div class="terminal-prompt-line">$ cmake-gui ready.</div>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    let state = {
      projects: [],
      activeProjectId: '',
      configurePresets: [],
      buildPresets: [],
      testPresets: [],
      activeConfigurePreset: '',
      activeBuildPreset: '',
      activeTarget: 'all',
      activeConfiguration: 'Debug',
      activeGenerator: 'Ninja',
      buildDir: '',
      cacheEntries: [],
      isProcessRunning: false,
      runInBuiltinTerminal: false,
      currentProcessName: '',
      lastCommand: ''
    };

    let activeFilterType = 'ALL';
    let showAdvanced = false;
    let timerInterval = null;
    let startTime = 0;
    let terminalLogBuffer = '';

    // Initialize listeners immediately
    setupEventListeners();

    // Tell extension we are ready
    vscode.postMessage({ command: 'ready' });

    window.addEventListener('message', event => {
      const msg = event.data;
      switch (msg.type) {
        case 'state':
          state = msg.state;
          renderUI();
          break;
        case 'output':
          appendLog(msg.text);
          break;
        case 'clearOutput':
          clearLogs();
          break;
        case 'processStart':
          onProcessStart(msg.name, msg.command);
          break;
        case 'processEnd':
          onProcessEnd(msg.result);
          break;
      }
    });

    function setupEventListeners() {
      // Tab switching
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const tab = btn.getAttribute('data-tab');
          if (tab) switchTab(tab);
        });
      });

      // Actions
      document.getElementById('btn-configure')?.addEventListener('click', runConfigure);
      document.getElementById('btn-build')?.addEventListener('click', runBuild);
      document.getElementById('btn-clean')?.addEventListener('click', runClean);
      document.getElementById('btn-test')?.addEventListener('click', runTest);
      document.getElementById('btn-stop')?.addEventListener('click', stopProcess);
      document.getElementById('btn-scaffold-presets')?.addEventListener('click', scaffoldPresets);

      // Terminal modes
      document.getElementById('mode-plugin-btn')?.addEventListener('click', () => setTerminalTarget(false));
      document.getElementById('mode-builtin-btn')?.addEventListener('click', () => setTerminalTarget(true));

      // Terminal toolbar buttons
      document.getElementById('btn-term-clear')?.addEventListener('click', clearLogs);
      document.getElementById('btn-term-copy')?.addEventListener('click', copyTerminalText);
      document.getElementById('btn-term-vscode')?.addEventListener('click', openVsCodeTerminal);

      document.getElementById('btn-full-term-clear')?.addEventListener('click', clearLogs);
      document.getElementById('btn-full-term-copy')?.addEventListener('click', copyTerminalText);
      document.getElementById('btn-full-term-vscode')?.addEventListener('click', openVsCodeTerminal);

      // Dropdowns
      document.getElementById('project-select')?.addEventListener('change', onProjectChange);
      document.getElementById('configure-preset-select')?.addEventListener('change', onConfigurePresetChange);
      document.getElementById('build-preset-select')?.addEventListener('change', onBuildPresetChange);
      document.getElementById('target-select')?.addEventListener('change', onTargetChange);
      document.getElementById('config-select')?.addEventListener('change', onConfigChange);
      document.getElementById('generator-select')?.addEventListener('change', onGeneratorChange);

      // Configurator filter & add
      document.getElementById('cache-search')?.addEventListener('input', filterCache);
      document.getElementById('pill-all')?.addEventListener('click', (e) => setFilterType('ALL', e.currentTarget));
      document.getElementById('pill-bool')?.addEventListener('click', (e) => setFilterType('BOOL', e.currentTarget));
      document.getElementById('pill-path')?.addEventListener('click', (e) => setFilterType('PATH', e.currentTarget));
      document.getElementById('pill-string')?.addEventListener('click', (e) => setFilterType('STRING', e.currentTarget));
      document.getElementById('pill-advanced')?.addEventListener('click', (e) => toggleAdvanced(e.currentTarget));
      document.getElementById('btn-add-cache-var')?.addEventListener('click', addCacheEntry);
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

      if (tabId === 'build') {
        document.getElementById('tab-btn-build')?.classList.add('active');
        document.getElementById('tab-build')?.classList.add('active');
      } else if (tabId === 'cache') {
        document.getElementById('tab-btn-cache')?.classList.add('active');
        document.getElementById('tab-cache')?.classList.add('active');
        renderCacheList();
      } else if (tabId === 'terminal' || tabId === 'logs' || tabId === 'output') {
        document.getElementById('tab-btn-terminal')?.classList.add('active');
        document.getElementById('tab-terminal')?.classList.add('active');
        const fullTerm = document.getElementById('full-terminal-body');
        if (fullTerm) fullTerm.scrollTop = fullTerm.scrollHeight;
      }
    }

    function renderUI() {
      // 1. Project select
      const projSelect = document.getElementById('project-select');
      if (projSelect) {
        projSelect.innerHTML = '';
        if (state.projects && state.projects.length > 0) {
          state.projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = p.name;
            if (p.id === state.activeProjectId) opt.selected = true;
            projSelect.appendChild(opt);
          });
          document.getElementById('project-group').style.display = state.projects.length > 1 ? 'block' : 'none';
        }
      }

      // 2. Configure presets select
      const confSelect = document.getElementById('configure-preset-select');
      if (confSelect) {
        confSelect.innerHTML = '';
        const activeProject = state.projects.find(p => p.id === state.activeProjectId);
        const hasPresets = state.configurePresets && state.configurePresets.length > 0;

        document.getElementById('no-presets-card').style.display = (!hasPresets && activeProject) ? 'block' : 'none';
        document.getElementById('custom-config-fields').style.display = !hasPresets ? 'block' : 'none';

        if (hasPresets) {
          state.configurePresets.forEach(preset => {
            const opt = document.createElement('option');
            opt.value = preset.name;
            opt.textContent = preset.displayName ? \`\${preset.displayName} (\${preset.name})\` : preset.name;
            if (preset.name === state.activeConfigurePreset) opt.selected = true;
            confSelect.appendChild(opt);
          });
          document.getElementById('preset-count').textContent = \`\${state.configurePresets.length} presets\`;
          
          const activePreset = state.configurePresets.find(p => p.name === state.activeConfigurePreset);
          document.getElementById('configure-preset-desc').textContent = 
            activePreset?.description || (activePreset?.generator ? \`Generator: \${activePreset.generator}\` : 'CMake Configure Preset');
        } else {
          const opt = document.createElement('option');
          opt.value = 'default';
          opt.textContent = '(Default Custom)';
          confSelect.appendChild(opt);
          document.getElementById('preset-count').textContent = 'No presets';
          document.getElementById('configure-preset-desc').textContent = 'Using custom CMake settings';
        }
      }

      // 3. Build preset select
      const buildSelect = document.getElementById('build-preset-select');
      if (buildSelect) {
        buildSelect.innerHTML = '';
        const defaultBuildOpt = document.createElement('option');
        defaultBuildOpt.value = '';
        defaultBuildOpt.textContent = '(Use Configure Preset Default)';
        buildSelect.appendChild(defaultBuildOpt);

        if (state.buildPresets && state.buildPresets.length > 0) {
          state.buildPresets.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.textContent = p.displayName ? \`\${p.displayName} (\${p.name})\` : p.name;
            if (p.name === state.activeBuildPreset) opt.selected = true;
            buildSelect.appendChild(opt);
          });
        }
      }

      // 4. Target select
      const targetSelect = document.getElementById('target-select');
      if (targetSelect) {
        targetSelect.innerHTML = '';
        const activeProject = state.projects.find(p => p.id === state.activeProjectId);
        const targets = activeProject?.targets || ['all'];
        targets.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t;
          opt.textContent = t === 'all' ? 'all (Build entire project)' : t;
          if (t === state.activeTarget) opt.selected = true;
          targetSelect.appendChild(opt);
        });
      }

      // 5. Update summary
      const activeProject = state.projects.find(p => p.id === state.activeProjectId);
      if (activeProject) {
        document.getElementById('summary-source-dir').textContent = activeProject.sourceDir;
      }
      document.getElementById('summary-build-dir').textContent = state.buildDir || (activeProject ? activeProject.sourceDir + '/build' : '-');
      document.getElementById('summary-command').textContent = state.lastCommand || 'cmake --preset ' + (state.activeConfigurePreset || 'default');

      updateProcessState();
      updateTerminalModeUI();
      renderCacheList();
    }

    function updateTerminalModeUI() {
      const pluginBtn = document.getElementById('mode-plugin-btn');
      const builtinBtn = document.getElementById('mode-builtin-btn');
      if (!pluginBtn || !builtinBtn) return;

      if (state.runInBuiltinTerminal) {
        builtinBtn.style.background = 'var(--vscode-button-background)';
        builtinBtn.style.color = 'var(--vscode-button-foreground)';
        pluginBtn.style.background = 'transparent';
        pluginBtn.style.color = 'var(--vscode-descriptionForeground)';
      } else {
        pluginBtn.style.background = 'var(--vscode-button-background)';
        pluginBtn.style.color = 'var(--vscode-button-foreground)';
        builtinBtn.style.background = 'transparent';
        builtinBtn.style.color = 'var(--vscode-descriptionForeground)';
      }
    }

    function setTerminalTarget(builtin) {
      state.runInBuiltinTerminal = builtin;
      updateTerminalModeUI();
      vscode.postMessage({ command: 'setTerminalMode', builtin });
    }

    function updateProcessState() {
      const badge = document.getElementById('process-badge');
      const stopBtn = document.getElementById('btn-stop');
      const configureBtn = document.getElementById('btn-configure');
      const buildBtn = document.getElementById('btn-build');
      const cleanBtn = document.getElementById('btn-clean');
      const testBtn = document.getElementById('btn-test');

      if (state.isProcessRunning) {
        badge.className = 'status-badge status-running';
        badge.textContent = state.currentProcessName || 'Running...';
        stopBtn.style.display = 'block';
        configureBtn.disabled = true;
        buildBtn.disabled = true;
        cleanBtn.disabled = true;
        testBtn.disabled = true;
      } else {
        badge.className = 'status-badge status-ready';
        badge.textContent = 'Ready';
        stopBtn.style.display = 'none';
        configureBtn.disabled = false;
        buildBtn.disabled = false;
        cleanBtn.disabled = false;
        testBtn.disabled = false;
      }
    }

    /* Process Lifecycle & Terminal handling */
    function onProcessStart(name, command) {
      state.isProcessRunning = true;
      state.currentProcessName = name;
      state.lastCommand = command;
      updateProcessState();

      const dot1 = document.getElementById('term-status-dot');
      const dot2 = document.getElementById('full-term-status-dot');
      if (dot1) dot1.className = 'term-dot running';
      if (dot2) dot2.className = 'term-dot running';

      document.getElementById('term-title-text').textContent = \`Running: \${name}\`;
      document.getElementById('term-footer-status').textContent = \`Executing: \${name}\`;
      document.getElementById('term-footer-cmd').textContent = command;

      startTime = Date.now();
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        document.getElementById('term-timer').textContent = \`(\${elapsed}s)\`;
      }, 100);

      const promptHtml = \`<div class="terminal-prompt-line" style="margin-top: 8px;">$ \${escapeHtml(command)}</div>\`;
      appendHtmlToTerminals(promptHtml);

      // Scroll terminal view into view smoothly
      const termCard = document.getElementById('plugin-terminal-card');
      if (termCard && !state.runInBuiltinTerminal) {
        termCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function onProcessEnd(result) {
      state.isProcessRunning = false;
      updateProcessState();
      clearInterval(timerInterval);

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      const exitCode = result?.exitCode ?? 0;
      const success = exitCode === 0;

      const dot1 = document.getElementById('term-status-dot');
      const dot2 = document.getElementById('full-term-status-dot');
      const statusClass = success ? 'term-dot success' : 'term-dot error';
      if (dot1) dot1.className = statusClass;
      if (dot2) dot2.className = statusClass;

      document.getElementById('term-title-text').textContent = \`Terminal: \${success ? 'Completed' : 'Failed'}\`;
      document.getElementById('term-footer-status').textContent = success ? \`Finished in \${elapsed}s\` : \`Failed (Exit \${exitCode})\`;

      const resultHtml = success
        ? \`<div style="color: #4cd964; margin-top: 4px; font-weight: bold;">[Finished successfully in \${elapsed}s]</div>\`
        : \`<div style="color: #ff5252; margin-top: 4px; font-weight: bold;">[Command failed with exit code \${exitCode} in \${elapsed}s]</div>\`;

      appendHtmlToTerminals(resultHtml);
    }

    function appendLog(rawText) {
      const formatted = ansiToHtml(rawText);
      terminalLogBuffer += rawText;
      appendHtmlToTerminals(formatted);
    }

    function appendHtmlToTerminals(html) {
      const inlineTerm = document.getElementById('plugin-terminal-body');
      const fullTerm = document.getElementById('full-terminal-body');

      if (inlineTerm) {
        inlineTerm.innerHTML += html;
        inlineTerm.scrollTop = inlineTerm.scrollHeight;
      }
      if (fullTerm) {
        fullTerm.innerHTML += html;
        fullTerm.scrollTop = fullTerm.scrollHeight;
      }
    }

    function clearLogs() {
      terminalLogBuffer = '';
      const inlineTerm = document.getElementById('plugin-terminal-body');
      const fullTerm = document.getElementById('full-terminal-body');
      if (inlineTerm) inlineTerm.innerHTML = '<div class="terminal-prompt-line">$ Terminal cleared.</div>';
      if (fullTerm) fullTerm.innerHTML = '<div class="terminal-prompt-line">$ Terminal cleared.</div>';
      document.getElementById('term-timer').textContent = '';
      const dot1 = document.getElementById('term-status-dot');
      const dot2 = document.getElementById('full-term-status-dot');
      if (dot1) dot1.className = 'term-dot idle';
      if (dot2) dot2.className = 'term-dot idle';
    }

    function copyTerminalText() {
      const inlineTerm = document.getElementById('plugin-terminal-body');
      if (inlineTerm) {
        navigator.clipboard.writeText(inlineTerm.innerText || terminalLogBuffer);
      }
    }

    function openVsCodeTerminal() {
      vscode.postMessage({ command: 'openTerminal' });
    }

    function ansiToHtml(text) {
      let html = escapeHtml(text);

      html = html
        .replace(/\\x1b\\[0?m/g, '</span>')
        .replace(/\\x1b\\[1m/g, '<span style="font-weight:bold;">')
        .replace(/\\x1b\\[2m/g, '<span style="opacity:0.7;">')
        .replace(/\\x1b\\[31m/g, '<span style="color: #ff5252;">')
        .replace(/\\x1b\\[32m/g, '<span style="color: #4cd964;">')
        .replace(/\\x1b\\[33m/g, '<span style="color: #ffd600;">')
        .replace(/\\x1b\\[34m/g, '<span style="color: #40a9ff;">')
        .replace(/\\x1b\\[35m/g, '<span style="color: #f759ab;">')
        .replace(/\\x1b\\[36m/g, '<span style="color: #36cfc9;">')
        .replace(/\\x1b\\[37m/g, '<span style="color: #ffffff;">')
        .replace(/\\x1b\\[90m/g, '<span style="color: #8c8c8c;">')
        .replace(/\\x1b\\[[0-9;]*m/g, '');

      return html;
    }

    function escapeHtml(text) {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function onProjectChange() {
      const val = document.getElementById('project-select').value;
      vscode.postMessage({ command: 'selectProject', projectId: val });
    }

    function onConfigurePresetChange() {
      const val = document.getElementById('configure-preset-select').value;
      vscode.postMessage({ command: 'selectConfigurePreset', presetName: val });
    }

    function onBuildPresetChange() {
      const val = document.getElementById('build-preset-select').value;
      vscode.postMessage({ command: 'selectBuildPreset', presetName: val });
    }

    function onTargetChange() {
      const val = document.getElementById('target-select').value;
      vscode.postMessage({ command: 'selectTarget', target: val });
    }

    function onConfigChange() {
      const val = document.getElementById('config-select').value;
      vscode.postMessage({ command: 'selectConfiguration', configuration: val });
    }

    function onGeneratorChange() {
      const val = document.getElementById('generator-select').value;
      vscode.postMessage({ command: 'selectGenerator', generator: val });
    }

    function runConfigure() {
      vscode.postMessage({ command: 'configure' });
    }

    function runBuild() {
      vscode.postMessage({ command: 'build' });
    }

    function runClean() {
      vscode.postMessage({ command: 'clean' });
    }

    function runTest() {
      vscode.postMessage({ command: 'test' });
    }

    function stopProcess() {
      vscode.postMessage({ command: 'stop' });
    }

    function scaffoldPresets() {
      vscode.postMessage({ command: 'scaffoldPresets' });
    }

    /* CONFIGURATOR CACHE LIST */
    function setFilterType(type, element) {
      activeFilterType = type;
      document.querySelectorAll('.filter-pill').forEach(p => {
        if (!p.id.includes('advanced')) p.classList.remove('active');
      });
      element.classList.add('active');
      renderCacheList();
    }

    function toggleAdvanced(element) {
      showAdvanced = !showAdvanced;
      element.classList.toggle('active', showAdvanced);
      renderCacheList();
    }

    function filterCache() {
      renderCacheList();
    }

    function renderCacheList() {
      const listContainer = document.getElementById('cache-list');
      if (!listContainer) return;
      listContainer.innerHTML = '';

      const query = (document.getElementById('cache-search')?.value || '').toLowerCase();
      const entries = state.cacheEntries || [];

      const filtered = entries.filter(e => {
        if (!showAdvanced && e.advanced) return false;
        if (activeFilterType !== 'ALL' && e.type !== activeFilterType) return false;
        if (query && !e.name.toLowerCase().includes(query) && !e.help.toLowerCase().includes(query)) return false;
        return true;
      });

      if (filtered.length === 0) {
        listContainer.innerHTML = \`
          <div class="empty-state">
            <div>\${entries.length === 0 ? 'No configurable cache variables found. Select a preset or run Configure.' : 'No variables match the search filter.'}</div>
          </div>
        \`;
        return;
      }

      filtered.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'cache-item';

        const header = document.createElement('div');
        header.className = 'cache-header';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'cache-name';
        nameSpan.textContent = entry.name;

        const typeSpan = document.createElement('span');
        typeSpan.className = 'cache-type';
        typeSpan.textContent = entry.type;

        header.appendChild(nameSpan);
        header.appendChild(typeSpan);
        item.appendChild(header);

        if (entry.help) {
          const helpSpan = document.createElement('div');
          helpSpan.className = 'cache-help';
          helpSpan.textContent = entry.help;
          item.appendChild(helpSpan);
        }

        if (entry.type === 'BOOL') {
          const toggleLabel = document.createElement('label');
          toggleLabel.className = 'toggle-container';

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = entry.value === '1' || entry.value.toUpperCase() === 'ON' || entry.value.toUpperCase() === 'TRUE';

          const textSpan = document.createElement('span');
          textSpan.textContent = checkbox.checked ? 'ON' : 'OFF';

          checkbox.addEventListener('change', () => {
            const newVal = checkbox.checked ? 'ON' : 'OFF';
            textSpan.textContent = newVal;
            vscode.postMessage({ command: 'updateCacheEntry', name: entry.name, value: newVal, type: 'BOOL' });
          });

          toggleLabel.appendChild(checkbox);
          toggleLabel.appendChild(textSpan);
          item.appendChild(toggleLabel);
        } else {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = entry.value;
          input.addEventListener('change', () => {
            vscode.postMessage({ command: 'updateCacheEntry', name: entry.name, value: input.value, type: entry.type });
          });
          item.appendChild(input);
        }

        listContainer.appendChild(item);
      });
    }

    function addCacheEntry() {
      const nameInput = document.getElementById('new-var-name');
      const typeSelect = document.getElementById('new-var-type');
      const valInput = document.getElementById('new-var-value');

      const name = nameInput.value.trim();
      const type = typeSelect.value;
      const value = valInput.value.trim();

      if (!name) return;

      vscode.postMessage({ command: 'addCacheEntry', name, type, value });
      nameInput.value = '';
      valInput.value = '';
    }
  </script>
</body>
</html>`;
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
