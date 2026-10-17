import * as vscode from 'vscode';

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  // Use a nonce to whitelist which scripts can be run
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CMake Configurator & Build</title>
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
      gap: 2px;
    }

    .tab-btn {
      background: none;
      border: none;
      color: var(--vscode-descriptionForeground);
      padding: 6px 10px;
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
      color: var(--vscode-panelTitle-activeForeground, #fff);
      border-bottom: 2px solid var(--vscode-panelTitle-activeBorder, var(--vscode-focusBorder));
    }

    .tab-pane {
      display: none;
    }

    .tab-pane.active {
      display: block;
    }

    /* Cards and Sections */
    .section {
      margin-bottom: 16px;
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

    /* Select, Input, Buttons */
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

    /* Info card */
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
      width: 90px;
      font-weight: 600;
      color: var(--vscode-descriptionForeground);
      flex-shrink: 0;
    }

    .info-val {
      color: var(--vscode-foreground);
      word-break: break-all;
      font-family: var(--vscode-editor-font-family, monospace);
    }

    /* Status indicator */
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

    /* Cache Table & Search */
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
    }

    .cache-item {
      padding: 8px;
      border-bottom: 1px solid var(--vscode-widget-border, #222);
      display: flex;
      flex-direction: column;
      gap: 4px;
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
      padding: 1px 4px;
      border-radius: 3px;
      background: var(--vscode-badge-background, #222);
      color: var(--vscode-badge-foreground, #aaa);
    }

    .cache-help {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      line-height: 1.3;
    }

    /* Terminal Output Preview */
    .terminal-output {
      background: var(--vscode-terminal-background, #1e1e1e);
      color: var(--vscode-terminal-foreground, #cccccc);
      font-family: var(--vscode-editor-font-family, "Courier New", Courier, monospace);
      font-size: 11px;
      padding: 8px;
      border-radius: var(--border-radius);
      height: 180px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-all;
      border: 1px solid var(--vscode-widget-border, #333);
    }

    /* Toggle switch for BOOL */
    .toggle-container {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .empty-state {
      text-align: center;
      padding: 24px 12px;
      color: var(--vscode-descriptionForeground);
    }

    .empty-state svg {
      margin-bottom: 8px;
      opacity: 0.6;
    }
  </style>
</head>
<body>

  <!-- Tab Navigation -->
  <div class="tab-nav">
    <button class="tab-btn active" onclick="switchTab('build')">Build & Presets</button>
    <button class="tab-btn" onclick="switchTab('cache')">Configurator</button>
    <button class="tab-btn" onclick="switchTab('output')">Logs</button>
  </div>

  <!-- TAB 1: Build & Presets -->
  <div id="tab-build" class="tab-pane active">

    <!-- Project Selector (if multi-root or multiple CMakeLists) -->
    <div class="field-group" id="project-group">
      <label class="field-label" for="project-select">Active CMake Project</label>
      <select id="project-select" onchange="onProjectChange()">
        <!-- Filled dynamically -->
      </select>
    </div>

    <!-- Configure Preset Dropdown -->
    <div class="field-group">
      <label class="field-label" for="configure-preset-select">
        Configure Preset
        <span id="preset-count" style="float: right; color: var(--vscode-descriptionForeground); font-weight: normal; font-size: 10px;"></span>
      </label>
      <select id="configure-preset-select" onchange="onConfigurePresetChange()">
        <!-- Filled dynamically -->
      </select>
      <div class="field-desc" id="configure-preset-desc">Select a preset from CMakePresets.json</div>
    </div>

    <!-- Build Preset Dropdown -->
    <div class="field-group">
      <label class="field-label" for="build-preset-select">Build Preset</label>
      <select id="build-preset-select" onchange="onBuildPresetChange()">
        <!-- Filled dynamically -->
      </select>
    </div>

    <!-- Target Dropdown -->
    <div class="field-group">
      <label class="field-label" for="target-select">Build Target</label>
      <select id="target-select" onchange="onTargetChange()">
        <!-- Filled dynamically -->
      </select>
    </div>

    <!-- Build Configuration & Generator (when no presets or custom) -->
    <div id="custom-config-fields" style="display: none;">
      <div class="field-group">
        <label class="field-label" for="config-select">Build Type</label>
        <select id="config-select" onchange="onConfigChange()">
          <option value="Debug">Debug</option>
          <option value="Release">Release</option>
          <option value="RelWithDebInfo">RelWithDebInfo</option>
          <option value="MinSizeRel">MinSizeRel</option>
        </select>
      </div>

      <div class="field-group">
        <label class="field-label" for="generator-select">Generator</label>
        <select id="generator-select" onchange="onGeneratorChange()">
          <option value="Ninja">Ninja</option>
          <option value="Unix Makefiles">Unix Makefiles</option>
          <option value="Visual Studio 17 2022">Visual Studio 17 2022</option>
        </select>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="section">
      <div class="section-title">
        <span>Actions</span>
        <span id="process-badge" class="status-badge status-ready">Ready</span>
      </div>

      <div class="actions-grid">
        <button id="btn-configure" class="btn btn-primary" onclick="runConfigure()">
          ⚡ Configure
        </button>
        <button id="btn-build" class="btn btn-primary" onclick="runBuild()">
          🔨 Build
        </button>
        <button id="btn-clean" class="btn btn-secondary" onclick="runClean()">
          🧹 Clean
        </button>
        <button id="btn-test" class="btn btn-secondary" onclick="runTest()">
          🧪 Test
        </button>
        <button id="btn-stop" class="btn btn-danger btn-block" style="display: none;" onclick="stopProcess()">
          ⏹️ Cancel Process
        </button>
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
      <button class="btn btn-secondary btn-block" onclick="scaffoldPresets()">
        Scaffold CMakePresets.json
      </button>
    </div>

  </div>

  <!-- TAB 2: CMake Configurator (Cache Variables) -->
  <div id="tab-cache" class="tab-pane">
    <div class="field-group">
      <div class="cache-filter-bar">
        <input type="text" id="cache-search" placeholder="Filter variables..." oninput="filterCache()">
      </div>
      <div class="cache-filter-pills">
        <span class="filter-pill active" onclick="setFilterType('ALL', this)">All</span>
        <span class="filter-pill" onclick="setFilterType('BOOL', this)">Booleans</span>
        <span class="filter-pill" onclick="setFilterType('PATH', this)">Paths</span>
        <span class="filter-pill" onclick="setFilterType('STRING', this)">Strings</span>
        <span class="filter-pill" onclick="toggleAdvanced(this)">Show Advanced</span>
      </div>
    </div>

    <!-- Cache list -->
    <div id="cache-list" class="cache-list">
      <!-- Filled dynamically -->
    </div>

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
        <button class="btn btn-secondary" onclick="addCacheEntry()" style="flex: 1;">Add</button>
      </div>
    </div>
  </div>

  <!-- TAB 3: Logs / Terminal Output -->
  <div id="tab-output" class="tab-pane">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span class="section-title" style="margin: 0;">Live Output</span>
      <button class="btn btn-secondary" style="font-size: 10px; padding: 2px 6px;" onclick="clearLogs()">Clear</button>
    </div>
    <div id="log-output" class="terminal-output">Waiting for CMake task...</div>
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
      currentProcessName: '',
      lastCommand: ''
    };

    let activeFilterType = 'ALL';
    let showAdvanced = false;

    // Notify extension we are ready
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
          document.getElementById('log-output').textContent = '';
          break;
        case 'processStart':
          state.isProcessRunning = true;
          state.currentProcessName = msg.name;
          state.lastCommand = msg.command;
          updateProcessState();
          break;
        case 'processEnd':
          state.isProcessRunning = false;
          updateProcessState();
          break;
      }
    });

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

      if (tabId === 'build') {
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('tab-build').classList.add('active');
      } else if (tabId === 'cache') {
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('tab-cache').classList.add('active');
        renderCacheList();
      } else if (tabId === 'output') {
        document.querySelector('.tab-btn:nth-child(3)').classList.add('active');
        document.getElementById('tab-output').classList.add('active');
      }
    }

    function renderUI() {
      // 1. Project select
      const projSelect = document.getElementById('project-select');
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

      // 2. Configure presets select
      const confSelect = document.getElementById('configure-preset-select');
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

      // 3. Build preset select
      const buildSelect = document.getElementById('build-preset-select');
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

      // 4. Target select
      const targetSelect = document.getElementById('target-select');
      targetSelect.innerHTML = '';
      const targets = activeProject?.targets || ['all'];
      targets.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t === 'all' ? 'all (Build entire project)' : t;
        if (t === state.activeTarget) opt.selected = true;
        targetSelect.appendChild(opt);
      });

      // 5. Update summary
      if (activeProject) {
        document.getElementById('summary-source-dir').textContent = activeProject.sourceDir;
      }
      document.getElementById('summary-build-dir').textContent = state.buildDir || (activeProject ? activeProject.sourceDir + '/build' : '-');
      document.getElementById('summary-command').textContent = state.lastCommand || 'cmake --preset ' + (state.activeConfigurePreset || 'default');

      updateProcessState();
      renderCacheList();
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
      switchTab('output');
    }

    function runBuild() {
      vscode.postMessage({ command: 'build' });
      switchTab('output');
    }

    function runClean() {
      vscode.postMessage({ command: 'clean' });
      switchTab('output');
    }

    function runTest() {
      vscode.postMessage({ command: 'test' });
      switchTab('output');
    }

    function stopProcess() {
      vscode.postMessage({ command: 'stop' });
    }

    function scaffoldPresets() {
      vscode.postMessage({ command: 'scaffoldPresets' });
    }

    // Cache list handling
    function setFilterType(type, element) {
      activeFilterType = type;
      document.querySelectorAll('.filter-pill').forEach(p => {
        if (p !== element && !p.textContent.includes('Advanced')) p.classList.remove('active');
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
            <div>\${entries.length === 0 ? 'No CMakeCache.txt found. Run "Configure" first!' : 'No variables match current filter.'}</div>
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

        // Value control based on type
        if (entry.type === 'BOOL') {
          const toggleLabel = document.createElement('label');
          toggleLabel.className = 'toggle-container';

          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.checked = entry.value === '1' || entry.value.toUpperCase() === 'ON' || entry.value.toUpperCase() === 'TRUE';
          checkbox.onchange = () => {
            const newVal = checkbox.checked ? 'ON' : 'OFF';
            vscode.postMessage({ command: 'updateCacheEntry', name: entry.name, value: newVal, type: 'BOOL' });
          };

          const text = document.createElement('span');
          text.textContent = checkbox.checked ? 'ON' : 'OFF';
          checkbox.addEventListener('change', () => { text.textContent = checkbox.checked ? 'ON' : 'OFF'; });

          toggleLabel.appendChild(checkbox);
          toggleLabel.appendChild(text);
          item.appendChild(toggleLabel);
        } else {
          const input = document.createElement('input');
          input.type = 'text';
          input.value = entry.value;
          input.onchange = () => {
            vscode.postMessage({ command: 'updateCacheEntry', name: entry.name, value: input.value, type: entry.type });
          };
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

    function appendLog(text) {
      const out = document.getElementById('log-output');
      out.textContent += text;
      out.scrollTop = out.scrollHeight;
    }

    function clearLogs() {
      document.getElementById('log-output').textContent = '';
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

