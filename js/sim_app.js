// sim_app.js - Update with Exam Mode functionality

// デフォルトの初期状態定義
const defaultSwitchStateTemplate = {
    mode: 'user', hostname: 'Switch', interfaces: {}, vlans: { '1': { name: 'default', status: 'active' } },
    runningConfig: { hostname: 'Switch', interfaces: {}, vlans: { '1': { name: 'default', status: 'active' } }, security: { users: {}, portSecurity: {}, sshKeysGenerated: false, sshVersion: 1 }, lines: {}, acls: {}, cdp: { enabled: true, interfaces: {} }, lldp: { enabled: false, interfaces: {} }, ntp: { server: null }, dhcpSnooping: { enabled: false, vlans: [], verifyMac: false }, logs: [], startupConfig: null }
};

const defaultRouterStateTemplate = {
    mode: 'user', hostname: 'Router', interfaces: {},
    runningConfig: { hostname: 'Router', interfaces: {}, routing: { staticRoutes: [], ipv6Routes: [] }, security: { users: {}, portSecurity: {}, sshKeysGenerated: false, sshVersion: 1 }, lines: {}, acls: {}, cdp: { enabled: true, interfaces: {} }, lldp: { enabled: false, interfaces: {} }, ntp: { server: null }, nat: { insideSourceList: null, interfaceOverload: null }, logs: [], startupConfig: null }
};

const appState = {
    currentScenarioId: null, currentDeviceName: null, devices: {}, pendingAction: null, examVars: null, sshSourceDevice: null // SSHセッション記録用
};

let engineReady = false;
const termFrame = document.getElementById('term-frame');
if (!termFrame) console.error("Term-frame not found!");

// PostMessage Communication Setup
window.addEventListener('message', (e) => {
    if (!e.data || !e.data.type) return;
    switch (e.data.type) {
        case 'ENGINE_READY': engineReady = true; if (appState.currentDeviceName) loadDeviceToEngine(appState.currentDeviceName); break;
        case 'STATE_RESPONSE': if (appState.currentDeviceName && appState.devices[appState.currentDeviceName]) appState.devices[appState.currentDeviceName].state = e.data.payload; if (appState.pendingAction) { const action = appState.pendingAction; if (action.timeoutId) clearTimeout(action.timeoutId); appState.pendingAction = null; if (action.type === 'SWITCH') { loadDeviceToEngine(action.targetName, action.isSsh); updateDeviceListUI(action.targetName); } else if (action.type === 'VALIDATE') performValidation(); } break;
        case 'RESET_REQUEST': if (confirm('本当にリセットしますか？')) if (appState.currentScenarioId) { initScenario(appState.currentScenarioId); termFrame.contentWindow.postMessage({ type: 'RESET_CONFIRMED' }, '*'); } break;
        case 'SSH_CHECK': handleSshCheck(e.data); break;
        case 'PING_CHECK': handlePingCheck(e.data); break;
        case 'TRACEROUTE_CHECK': handleTracerouteCheck(e.data); break;
        case 'SWITCH_DEVICE': if (e.data.targetName) { if (e.data.isSsh) appState.sshSourceDevice = appState.currentDeviceName; limitSwitchDevice(e.data.targetName, e.data.isSsh); } break;
        case 'SSH_EXIT': if (appState.sshSourceDevice) { const target = appState.sshSourceDevice; appState.sshSourceDevice = null; limitSwitchDevice(target, false); } break;
    }
});

function appendToTerminal(text) { termFrame.contentWindow.postMessage({ type: 'APPEND_LOG', payload: text }, '*'); }
function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }

// シナリオ初期化処理
function initScenario(scenarioId) {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    appState.currentScenarioId = scenarioId;
    appState.devices = {};
    appState.examVars = null; // Store dynamic variables here

    const deviceListEl = document.getElementById('device-list');
    deviceListEl.innerHTML = '';
    const logEl = document.getElementById('validation-log');
    if (logEl) logEl.textContent = ''; logEl.style.color = '#333';

    // 変更：試験モードフラグの取得とシナリオ情報の更新
    const urlParams = new URLSearchParams(window.location.search);
    const currentPracticeMode = urlParams.get('mode') === 'practice';
    const currentExamMode = urlParams.get('mode') === 'exam'; // Assuming you implement this new mode, or dual mode handling

    // Clear previous scenario diagram state
    const topologyArea = document.querySelector('.topology-area');
    const staticImage = document.getElementById('scenario-image');
    const topologyContainer = document.getElementById('topology-container');
    
    // reset overlay
    const overlayIds = ['topo-q4-ipv4', 'topo-q4-ipv6'];
    overlayIds.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
    
    // --- 試験モード (ExamMode) AND 変数生成サポートありの場合 ---
    if (scenario.generateVars && typeof scenario.generateVars === 'function' && topologyContainer) {
        console.log("Loading Examination Mode Scenario:", scenarioId);
        // 1. Generate dynamic variables
        appState.examVars = scenario.generateVars();

        // 2. Apply dynamic tasks
        scenario.tasks = scenario.getTasks(appState.examVars);
        scenario.tasksHtml = null; // Reset static HTML tasks

        // 3. Apply dynamic validation
        scenario.validations = scenario.getValidations(appState.examVars);

        // 4. Update Topology Diagram Overlay (Approach 1)
        // Question 4 specific logic: map dynamic variables to HTML overlay IDs
        constipv4El = document.getElementById('topo-q4-ipv4');
        if (ipv4El) ipv4El.textContent = appState.examVars.ipv4Subnet;
        
        constipv6El = document.getElementById('topo-q4-ipv6');
        if (ipv6El) ipv6El.textContent = appState.examVars.ipv6Subnet;

        // Set the base image
        const baseImage = document.getElementById('scenario-image-base');
        baseImage.src = scenario.image;
        topologyContainer.style.display = 'inline-block'; // Show dynamic structure
        staticImage.style.display = 'none'; // Hide static image element

        // Update description with guidelines (tasks now populated in tasksEl)
        document.getElementById('scenario-desc').innerHTML = scenario.description || scenario.desc || '';
        
    } else {
        // --- Normal / Practice Mode (Default Fallback) ---
        console.log("Loading Standard Mode Scenario:", scenarioId);
        topologyContainer.style.display = 'none'; // Hide dynamic structure
        if (scenario.image) {
            staticImage.src = scenario.image;
            staticImage.style.display = 'block'; // Show static image
        }
        document.getElementById('scenario-desc').innerHTML = scenario.description || scenario.desc || '';
    }

    // 左ペインのタスク表示エリアへの展開 (Practice mode handling remains here, but might show dynamic info if in dual mode)
    const tasksEl = document.getElementById('scenario-tasks');
    if (tasksEl) {
        let tasksHtml = '<ol>';
        if (scenario.tasks && Array.isArray(scenario.tasks)) {
            scenario.tasks.forEach((t, index) => {
                tasksHtml += `<li>${t}</li>`;
                
                // --- Practice mode answers display (Practice flag true) ---
                if (currentPracticeMode) {
                    let answer = null;
                    // Dual mode: PracticeMode AND dynamic ExamVars generated
                    if (appState.examVars && scenario.getAnswers && typeof scenario.getAnswers === 'function') {
                        const dynamicAnswers = scenario.getAnswers(appState.examVars);
                        answer = dynamicAnswers[index];
                    }
                    // Normal PracticeMode: static answers defined
                    else if (scenario.answers && scenario.answers[index]) {
                        answer = scenario.answers[index];
                    }

                    if (answer) {
                        tasksHtml += `
                            <div class="command-hint-box">
                                <span class="command-hint-label">💡 解答コマンド</span>
                                <pre class="command-hint-code">${answer}</pre>
                            </div>
                        `;
                    }
                }
            });
        }
        tasksHtml += '</ol>';
        tasksEl.innerHTML = tasksHtml;
    }

    // タブの初期化
    initTabs();

    // デバイス初期化とUIボタン作成
    scenario.devices.forEach((dev, index) => {
        let state;
        if (dev.type === 'switch') { state = deepCopy(defaultSwitchStateTemplate); state.hostname = dev.name; state.runningConfig.hostname = dev.name; }
        else { state = deepCopy(defaultRouterStateTemplate); state.hostname = dev.name; state.runningConfig.hostname = dev.name; }
        
        appState.devices[dev.name] = { type: dev.type, state: state };

        const btn = document.createElement('button');
        btn.textContent = dev.name;
        btn.className = 'device-tab-btn';
        btn.onclick = () => limitSwitchDevice(dev.name);
        if (index === 0) btn.classList.add('active');
        deviceListEl.appendChild(btn);
    });

    // 最初のデバイスを選択
    if (scenario.devices.length > 0) {
        appState.currentDeviceName = scenario.devices[0].name;
        if (engineReady) loadDeviceToEngine(appState.currentDeviceName);
    }
}

// タブ初期化ロジック ( simulator.html 内の sim_app.js を利用)
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const targetContent = document.getElementById(targetId);
            if (targetContent) targetContent.classList.add('active');
        });
    });
}
function switchToTab(tabId) { const tabBtns = document.querySelectorAll('.tab-btn'); const tabContents = document.querySelectorAll('.tab-content'); tabBtns.forEach(b => b.classList.remove('active')); tabContents.forEach(c => c.classList.remove('active')); tabBtns.forEach(btn => { if (btn.getAttribute('data-tab') === tabId) btn.classList.add('active'); }); const targetContent = document.getElementById(tabId); if (targetContent) targetContent.classList.add('active'); }

// デバイス切り替え処理 (非同期State保存を含むためラップ)
function limitSwitchDevice(nextDeviceName, isSsh = false) {
    if (appState.currentDeviceName === nextDeviceName) return;
    if (appState.currentDeviceName) {
        termFrame.contentWindow.postMessage({ type: 'GET_STATE' }, '*');
        appState.pendingAction = { type: 'SWITCH', targetName: nextDeviceName, isSsh: isSsh };
    } else { loadDeviceToEngine(nextDeviceName, isSsh); updateDeviceListUI(nextDeviceName); }
}

function loadDeviceToEngine(deviceName, isSsh = false) {
    const target = appState.devices[deviceName];
    if (!target || !termFrame.contentWindow) return;
    appState.currentDeviceName = deviceName;
    
    // LOAD_STATE
    termFrame.contentWindow.postMessage({ type: 'LOAD_STATE', payload: target.state, deviceType: target.type, isSsh: isSsh }, '*');
    
    // FOCUS
    setTimeout(() => { termFrame.contentWindow.postMessage({ type: 'FOCUS' }, '*'); }, 100);
}

function updateDeviceListUI(activeName) {
    const buttons = document.querySelectorAll('#device-list button');
    buttons.forEach(btn => { if (btn.textContent === activeName) btn.classList.add('active'); else btn.classList.remove('active'); });
}

// 判定ロジック定義
function performValidation() {
    const scenario = scenarios.find(s => s.id === appState.currentScenarioId);
    if (!scenario || !scenario.validations) return;
    const logEl = document.getElementById('validation-log');
    if (!logEl) return;
    
    // Clear validation results tab contents
    logEl.innerHTML = '';
    
    let ngMessages = [];
    scenario.validations.forEach(val => {
        const targetDevice = appState.devices[val.device];
        if (!targetDevice) return;
        const actualValue = pathResolver(targetDevice.state, val.path);
        
        if (typeof val.condition === 'function') {
            if (!val.condition(actualValue)) ngMessages.push(`<span class="ng-tag">[NG]</span> ${val.message}`);
        } else if (val.match === 'contains') {
            const isMatch = Array.isArray(actualValue) && actualValue.some(item => {
                return Object.keys(val.expected).every(key => item && String(item[key]) === String(val.expected[key]));
            });
            if (!isMatch) ngMessages.push(`<span class="ng-tag">[NG]</span> ${val.message}`);
        } else if (val.match === 'containsAll') {
             // 許可VLAN判定（配列）
            if(!actualValue || !Array.isArray(actualValue)) { ngMessages.push(`<span class="ng-tag">[NG]</span> ${val.message}`); return; }
            if(!compareVlanArrays(actualValue, val.expected)) ngMessages.push(`<span class="ng-tag">[NG]</span> ${val.message}`);
        } else if (val.hasOwnProperty('expected')) {
            if (String(actualValue) !== String(val.expected)) ngMessages.push(`<span class="ng-tag">[NG]</span> ${val.message}`);
        }
    });

    if (ngMessages.length === 0) {
        logEl.innerHTML += '<div style="color: #4caf50; font-weight: bold; margin-top: 10px;">すべて正解です！素晴らしい！</div>';
    } else {
        let html = '<ul>';
        ngMessages.forEach(msg => { html += `<li>${msg}</li>`; });
        html += '</ul>';
        logEl.innerHTML += html;
    }
}

// Helper: Vlan allowed All/Partial list comparison
function compareVlanArrays(actual, expected) {
    if (actual.includes('all')) return true;
    return expected.every(item => actual.includes(item));
}

function pathResolver(obj, path) { return path.split('.').reduce((acc, part) => acc && acc[part], obj); }

// Event Listeners
document.getElementById('check-answer-btn').addEventListener('click', performValidation);
document.getElementById('home-btn').addEventListener('click', () => { window.location.href = 'index.html'; });

// Initial Load execution from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const sceneId = urlParams.get('scenario');
if (sceneId && typeof scenarios !== 'undefined') { initScenario(sceneId); }

// Handle specific handlers (SSH, PING, etc. omitted as not updated)
function handleSshCheck(data) { /*...as provided... */ }
function handlePingCheck(data) { /*...as provided... */ }
function handleTracerouteCheck(data) { /*...as provided... */ }
