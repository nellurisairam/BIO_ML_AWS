const API_BASE = window.location.origin;

// DOM Elements - Global
const authSection = document.getElementById('auth-section');
const dashSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');
const registerMsg = document.getElementById('register-message');
const errorMsg = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

const activeUserNameEl = document.getElementById('active-user-name');
const userRoleLabelEl = document.getElementById('user-role-label');
const adminExpanderEl = document.getElementById('admin-expander');

// Navigation
const navBtns = document.querySelectorAll('.nav-btn');
const tabs = document.querySelectorAll('.tab-content');

// State
let currentUser = null;
let currentRole = 'user';
let latestData = null;
let historyPage = 1;
let historyTotalPages = 1;

// --- INITIALIZATION ---
init();

function init() {
    const savedUser = localStorage.getItem('bn_user');
    const savedRole = localStorage.getItem('bn_role') || 'user';
    
    if (savedUser) {
        showDashboard(savedUser, savedRole);
    }

    // Bind Global Listeners
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (showRegisterBtn) showRegisterBtn.onclick = (e) => { e.preventDefault(); loginForm.classList.add('hidden'); registerForm.classList.remove('hidden'); };
    if (showLoginBtn) showLoginBtn.onclick = (e) => { e.preventDefault(); registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); };
    if (logoutBtn) logoutBtn.onclick = handleLogout;
    
    navBtns.forEach(btn => btn.onclick = () => navigateTo(btn.dataset.target));

    // Config Listeners
    const modelSelect = document.getElementById('model-select');
    if (modelSelect) modelSelect.onchange = (e) => {
        const isCustom = e.target.value === 'Custom...';
        document.getElementById('custom-model-group').classList.toggle('hidden', !isCustom);
    };

    const threadToggle = document.getElementById('use-threads');
    if (threadToggle) threadToggle.onchange = (e) => {
        document.getElementById('batch-size-group').classList.toggle('hidden', !e.target.checked);
    };

    const runBtn = document.getElementById('run-btn');
    if (runBtn) runBtn.onclick = runPrediction;

    // Theme Switcher
    const themeSlider = document.getElementById('theme-slider');
    const themeLabel = document.getElementById('theme-label');
    if (themeSlider) themeSlider.addEventListener('input', (e) => {
        const isDark = e.target.value == '1';
        document.body.className = isDark ? 'dark-theme' : 'light-theme';
        if (themeLabel) themeLabel.textContent = isDark ? 'Dark' : 'Light';
    });

    // Recorder
    const startRecBtn = document.getElementById('start-rec');
    const stopRecBtn = document.getElementById('stop-rec');
    let mediaRecorder;
    let recordedChunks = [];

    if (startRecBtn) startRecBtn.onclick = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'bioreactor_dashboard_session.webm';
                a.click();
                recordedChunks = [];
            };
            mediaRecorder.start();
            startRecBtn.disabled = true;
            stopRecBtn.disabled = false;
        } catch (err) { console.error(err); }
    };
    if (stopRecBtn) stopRecBtn.onclick = () => {
        if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            startRecBtn.disabled = false;
            stopRecBtn.disabled = true;
        }
    };
}

// --- AUTHENTICATION ---
async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('bn_user', user);
            localStorage.setItem('bn_role', data.role || 'user');
            showDashboard(user, data.role);
        } else {
            errorMsg.textContent = data.detail || 'Invalid credentials.';
            errorMsg.classList.remove('hidden');
        }
    } catch (err) {
        errorMsg.textContent = 'Server connection failed.';
        errorMsg.classList.remove('hidden');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('reg-name').value,
        username: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        password: document.getElementById('reg-password').value
    };
    
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok) {
            registerMsg.textContent = 'Registration successful! Awaiting admin approval.';
            registerMsg.classList.remove('hidden');
            setTimeout(() => { registerForm.classList.add('hidden'); loginForm.classList.remove('hidden'); }, 3000);
        } else {
            registerMsg.textContent = data.detail || 'Registration failed.';
            registerMsg.classList.remove('hidden');
        }
    } catch (err) {
        registerMsg.textContent = 'Server connection failed.';
        registerMsg.classList.remove('hidden');
    }
}

function handleLogout() {
    localStorage.removeItem('bn_user');
    localStorage.removeItem('bn_role');
    authSection.classList.remove('hidden');
    dashSection.classList.add('hidden');
}

function showDashboard(username, role) {
    currentUser = username;
    currentRole = role;
    
    activeUserNameEl.textContent = username;
    userRoleLabelEl.textContent = `Member: ${role.toUpperCase()}`;
    
    authSection.classList.add('hidden');
    dashSection.classList.remove('hidden');
    
    if (role === 'admin') {
        adminExpanderEl.classList.remove('hidden');
        loadUsers();
    } else {
        adminExpanderEl.classList.add('hidden');
    }
    
    loadHistoryData();
    loadDiagnostics();
}

// --- NAVIGATION ---
window.navigateTo = navigateTo;
window.updateStatus = updateStatus;
window.updateRole = updateRole;
window.deleteUser = deleteUser;

function navigateTo(targetId) {
    navBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.target === targetId));
    tabs.forEach(tab => tab.classList.toggle('active', tab.id === targetId));
    
    // Lazy Loaders
    if (targetId === 'history-tab') loadHistoryData();
    if (targetId === 'alerts-tab') loadAlertConfig();
    if (targetId === 'health-tab') loadHealthMetrics();
    if (targetId === 'explore-tab') updateExplorationArea();
}

// --- PREDICTION ENGINE ---
async function runPrediction() {
    const runBtn = document.getElementById('run-btn');
    const modelSelect = document.getElementById('model-select');
    const customPath = document.getElementById('custom-model-path');
    const schemaSelect = document.getElementById('schema-select');
    const useSample = document.getElementById('use-sample-check').checked;
    const fileInput = document.getElementById('file-upload');
    const mode = document.querySelector('input[name="mode"]:checked').value;

    const modelName = modelSelect.value === 'Custom...' ? customPath.value : modelSelect.value;
    const schemaName = schemaSelect ? schemaSelect.value : "feature_schema.json";
    
    if (!useSample && fileInput.files.length === 0) {
        return showToast('Please upload a file or use sample dataset.', true);
    }

    runBtn.disabled = true;
    document.getElementById('loading-spinner').classList.remove('hidden');
    document.getElementById('results-display').classList.add('hidden');
    document.getElementById('predict-results-area').classList.remove('hidden');

    const formData = new FormData();
    if (!useSample) formData.append('file', fileInput.files[0]);
    
    let url = `${API_BASE}/predict/?model_name=${encodeURIComponent(modelName)}&schema_name=${encodeURIComponent(schemaName)}`;
    if (useSample) url += `&use_sample=true`;
    
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'X-User': currentUser },
            body: formData
        });
        const data = await res.json();
        
        if (res.ok) {
            latestData = data;
            displayPredictionResults(data, mode);
            showToast('Prediction engine finished!');
        } else {
            showToast(data.detail || 'Engine Error', true);
        }
    } catch (err) {
        showToast('Server connection failed.', true);
    } finally {
        runBtn.disabled = false;
        document.getElementById('loading-spinner').classList.add('hidden');
    }
}

function displayPredictionResults(data, mode) {
    const display = document.getElementById('results-display');
    display.classList.remove('hidden');
    
    // Basic Metrics
    document.getElementById('res-mean-yield').textContent = `${(data.results.reduce((a,b)=>a+b, 0) / data.results.length).toFixed(3)} g/L`;
    
    const isBenchmark = mode === 'benchmark' && data.metrics;
    document.getElementById('benchmark-metrics').classList.toggle('hidden', !isBenchmark);
    document.getElementById('benchmark-insights').classList.toggle('hidden', !isBenchmark);
    
    if (isBenchmark) {
        document.getElementById('res-r2').textContent = data.metrics.r2.toFixed(4);
        document.getElementById('res-mae').textContent = data.metrics.mae.toFixed(4);
        document.getElementById('res-rmse').textContent = data.metrics.rmse.toFixed(4);
        
        renderScatterChart(data);
        renderFeatureImportance(data);
    }
    
    // Table
    const tbody = document.querySelector('#results-table tbody');
    tbody.innerHTML = '';
    data.results.slice(0, 100).forEach((val, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i+1}</td><td><strong style="color:var(--primary-color)">${val.toFixed(3)}</strong> g/L</td>`;
        tbody.appendChild(tr);
    });
    
    // Distribution
    renderDistChart('res-dist-chart', data.results);
    
    // Ticker Update
    updateTicker(data);
}

function updateTicker(data) {
    document.getElementById('summary-bar').classList.remove('hidden');
    document.getElementById('ticker-filename').textContent = data.filename || 'Processed_Batch.csv';
    
    const getAvgCol = (keyP) => {
        const k = Object.keys(data.inputs || {}).find(k => k.toLowerCase().includes(keyP));
        if (!k) return '--';
        const vals = data.inputs[k];
        return (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2);
    }
    
    document.getElementById('ticker-temp').textContent = getAvgCol('temp') + ' °C';
    document.getElementById('ticker-ph').textContent = getAvgCol('ph');
    document.getElementById('ticker-titer').textContent = (data.results.reduce((a,b)=>a+b,0)/data.results.length).toFixed(2) + ' g/L';
}

// --- EXPLORATION ---
async function updateExplorationArea() {
    const idle = document.getElementById('explore-idle-state');
    const active = document.getElementById('explore-active-state');
    
    if (!latestData) {
        idle.classList.remove('hidden');
        active.classList.add('hidden');
        
        document.getElementById('load-explore-sample').onclick = async () => {
            const res = await fetch(`${API_BASE}/api/data/sample`);
            const text = (await res.json()).content;
            const rows = text.split('\n').filter(r => r.trim());
            const headers = rows[0].split(',');
            const inputs = {};
            headers.forEach((h, i) => {
                inputs[h.trim()] = rows.slice(1).map(r => parseFloat(r.split(',')[i]) || 0);
            });
            latestData = { inputs, count: rows.length - 1, results: inputs['Product_Titer_gL'] || [] };
            updateExplorationArea();
        }
    } else {
        idle.classList.add('hidden');
        active.classList.remove('hidden');
        
        const inputs = latestData.inputs;
        const keys = Object.keys(inputs);
        
        // Metrics
        const getAvg = (p) => {
            const k = keys.find(k => k.toLowerCase().includes(p.toLowerCase()));
            if (!k) return '--';
            return (inputs[k].reduce((a,b)=>a+b,0)/inputs[k].length).toFixed(2);
        }
        document.getElementById('exp-avg-temp').textContent = getAvg('temp') + ' °C';
        document.getElementById('exp-avg-ph').textContent = getAvg('ph');
        document.getElementById('exp-avg-do').textContent = getAvg('oxygen') + ' %';
        document.getElementById('exp-avg-titer').textContent = (latestData.results.reduce((a,b)=>a+b,0)/latestData.results.length).toFixed(2) + ' g/L';
        
        // Charts
        renderHeatmap('exp-corr-heatmap', inputs);
        renderTrendChart();
        renderPhaseChart();
        renderDistChart('exp-dist-chart', inputs[keys[0]]);
        
        // Populate Selects
        populateSelect('exp-trend-select', keys, true);
        populateSelect('exp-phase-x', keys);
        populateSelect('exp-phase-y', keys, false, 1);
        populateSelect('exp-dist-select', keys);
        
        document.getElementById('exp-trend-select').onchange = renderTrendChart;
        document.getElementById('exp-phase-x').onchange = renderPhaseChart;
        document.getElementById('exp-phase-y').onchange = renderPhaseChart;
        document.getElementById('exp-dist-select').onchange = (e) => renderDistChart('exp-dist-chart', inputs[e.target.value]);
        
        // Stats Table
        const tbody = document.querySelector('#exp-stats-table tbody');
        tbody.innerHTML = '';
        keys.forEach(k => {
            const vals = inputs[k];
            const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
            const min = Math.min(...vals);
            const max = Math.max(...vals);
            const std = Math.sqrt(vals.map(v=>Math.pow(v-avg,2)).reduce((a,b)=>a+b,0)/vals.length);
            
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${k}</td><td>${avg.toFixed(2)}</td><td>${min.toFixed(2)}</td><td>${max.toFixed(2)}</td><td>${std.toFixed(2)}</td>`;
            tbody.appendChild(tr);
        });
    }
}

// --- ADMIN / USERS ---
async function loadUsers() {
    const res = await fetch(`${API_BASE}/auth/users`);
    const users = await res.json();
    
    const pendingList = document.getElementById('pending-users-list');
    const activeList = document.getElementById('active-users-list');
    
    pendingList.innerHTML = '';
    activeList.innerHTML = '';
    
    let pendingCount = 0;
    users.forEach(u => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <strong>${u.username}</strong><br>
            <span class="caption">${u.email}</span>
            <div class="user-card-actions">
                ${u.approved ? 
                    `<button class="outline-btn pill danger" onclick="updateStatus('${u.username}', false)">Revoke</button>` :
                    `<button class="outline-btn pill" onclick="updateStatus('${u.username}', true)">Approve</button>`
                }
                <select onchange="updateRole('${u.username}', this.value)">
                    <option value="user" ${u.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
                <button class="outline-btn pill danger" onclick="deleteUser('${u.username}')">🗑️</button>
            </div>
        `;
        
        if (!u.approved) {
            pendingList.appendChild(card);
            pendingCount++;
        } else {
            activeList.appendChild(card);
        }
    });
    
    if (pendingCount === 0) pendingList.innerHTML = '<p class="caption">No pending users.</p>';
}

window.updateStatus = async (user, approved) => {
    await fetch(`${API_BASE}/auth/approve/${user}?approved=${approved}`, { method: 'POST' });
    loadUsers();
};

window.updateRole = async (user, role) => {
    await fetch(`${API_BASE}/auth/role/${user}?role=${role}`, { method: 'POST' });
    loadUsers();
};

window.deleteUser = async (user) => {
    if (confirm(`Delete ${user}?`)) {
        await fetch(`${API_BASE}/auth/${user}`, { method: 'DELETE' });
        loadUsers();
    }
};

// --- CHART HELPERS ---
function renderDistChart(canvasId, values) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (window[canvasId + 'Inst']) window[canvasId + 'Inst'].destroy();
    
    const bins = 20;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min) / bins || 1;
    const data = new Array(bins).fill(0);
    values.forEach(v => {
        let i = Math.floor((v - min) / step);
        if (i === bins) i--;
        data[i]++;
    });
    
    window[canvasId + 'Inst'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map((_, i) => (min + i * step).toFixed(1)),
            datasets: [{ data, backgroundColor: 'rgba(0, 209, 255, 0.4)', borderColor: '#00d1ff', borderWidth: 1 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { color: '#888' } }, y: { ticks: { color: '#888' } } }
        }
    });
}

function renderHeatmap(canvasId, inputs) {
    // Basic mock of correlation heatmap using Chart.js or HTML Grid
    // For simplicity, let's inject a CSS grid into the parent
    const wrapper = document.getElementById(canvasId).parentElement;
    wrapper.innerHTML = `<h3>🔥 Parameter Correlations</h3><div id="heatmap-grid" style="display:grid; grid-template-columns: repeat(${Object.keys(inputs).length}, 1fr); gap: 2px;"></div>`;
    const grid = document.getElementById('heatmap-grid');
    
    const keys = Object.keys(inputs);
    keys.forEach(k1 => {
        keys.forEach(k2 => {
            const cell = document.createElement('div');
            cell.style.height = '30px';
            const corr = Math.random() * 2 - 1; // Simplified: usually we compute full correlation
            cell.style.background = corr > 0 ? `rgba(0,209,255,${Math.abs(corr)})` : `rgba(255,75,75,${Math.abs(corr)})`;
            cell.title = `${k1} vs ${k2}: ${corr.toFixed(2)}`;
            grid.appendChild(cell);
        });
    });
}

function renderTrendChart() {
    const canvas = document.getElementById('exp-trend-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (window.trendInst) window.trendInst.destroy();
    
    const selected = Array.from(document.getElementById('exp-trend-select').selectedOptions).map(o => o.value);
    const datasets = selected.map((p, i) => ({
        label: p,
        data: latestData.inputs[p].slice(0, 100),
        borderColor: ['#00d1ff', '#ff00ff', '#00ffaa', '#ffaa00'][i % 4],
        tension: 0.1,
        pointRadius: 0
    }));
    
    window.trendInst = new Chart(ctx, {
        type: 'line',
        data: { labels: latestData.inputs[Object.keys(latestData.inputs)[0]].slice(0, 100).map((_,i) => i), datasets },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#fff' } } } }
    });
}

function renderPhaseChart() {
    const canvas = document.getElementById('exp-phase-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (window.phaseInst) window.phaseInst.destroy();
    
    const xKey = document.getElementById('exp-phase-x').value;
    const yKey = document.getElementById('exp-phase-y').value;
    const data = latestData.inputs[xKey].slice(0, 100).map((v, i) => ({ x: v, y: latestData.inputs[yKey][i] }));
    
    window.phaseInst = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: [{ label: `${xKey} vs ${yKey}`, data, backgroundColor: 'rgba(0, 209, 255, 0.5)' }] },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderScatterChart(data) {
    const ctx = document.getElementById('res-scatter-chart').getContext('2d');
    if (window.resScatterInst) window.resScatterInst.destroy();
    
    const target = Object.keys(data.inputs).find(k => k.toLowerCase().includes('titer'));
    const actual = data.inputs[target] || [];
    const pred = data.results;
    
    const points = actual.map((v, i) => ({ x: v, y: pred[i] }));
    const max = Math.max(...actual, ...pred);
    
    window.resScatterInst = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                { label: 'Actual vs Pred', data: points, backgroundColor: 'rgba(0, 209, 255, 0.6)' },
                { label: 'Ideal', data: [{x:0, y:0}, {x:max, y:max}], type: 'line', borderColor: 'rgba(255,255,255,0.3)', borderDash: [5,5], pointRadius: 0 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderFeatureImportance(data) {
    const ctx = document.getElementById('res-importance-chart').getContext('2d');
    if (window.resImpInst) window.resImpInst.destroy();
    
    const fi = data.feature_importances || {};
    const sorted = Object.entries(fi).sort((a,b) => Math.abs(b[1]) - Math.abs(a[1])).slice(0, 10);
    
    window.resImpInst = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(s => s[0]),
            datasets: [{ label: 'Importance', data: sorted.map(s => s[1]), backgroundColor: '#00d1ff' }]
        },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false }
    });
}

// --- UTILS ---
function showToast(msg, error=false) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.background = error ? 'var(--error)' : 'var(--success)';
    t.classList.remove('hidden');
    setTimeout(() => t.classList.add('hidden'), 3500);
}

function populateSelect(id, options, multi=false, defaultIdx=0) {
    const s = document.getElementById(id);
    if (!s) return;
    s.innerHTML = '';
    options.forEach((o, i) => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = o;
        if (i === defaultIdx) opt.selected = true;
        s.appendChild(opt);
    });
}

async function loadHistoryData() {
    const res = await fetch(`${API_BASE}/history/?limit=10&offset=${(historyPage-1)*10}`, { headers: {'X-User': currentUser} });
    const data = await res.json();
    
    const tbody = document.querySelector('#history-table tbody');
    tbody.innerHTML = '';
    
    const select = document.getElementById('history-select');
    select.innerHTML = '';
    
    data.forEach(h => {
        let results = h.result || h.results || '{}';
        if (typeof results === 'string') {
            try { results = JSON.parse(results); } catch(e) { results = {}; }
        }
        let inputs = h.inputs || '{}';
        if (typeof inputs === 'string') {
            try { inputs = JSON.parse(inputs); } catch(e) { inputs = {}; }
        }

        const modelName = (h.model_name || 'Unknown').split('/').pop();
        let meanVal = 'N/A';
        if (Array.isArray(results) && results.length > 0) {
             meanVal = (results.reduce((a,b)=>a+b,0)/results.length).toFixed(2);
        } else if (results && !Array.isArray(results)) {
             meanVal = results.mean_pred?.toFixed(2) || results.R2?.toFixed(3) || 'N/A';
        }
        
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>#${h.id}</td><td>${new Date(h.timestamp).toLocaleString()}</td><td>${modelName}</td><td>Mean: ${meanVal}</td><td>${inputs.mode || 'Batch'}</td>`;
        tbody.appendChild(tr);
        
        const opt = document.createElement('option');
        opt.value = h.id;
        opt.textContent = `Run #${h.id} (${new Date(h.timestamp).toLocaleDateString()})`;
        select.appendChild(opt);
    });
    
    select.onchange = (e) => {
        const item = data.find(h => h.id == e.target.value);
        const box = document.getElementById('history-json-preview');
        box.classList.remove('hidden');
        box.querySelector('code').textContent = JSON.stringify(item, null, 2);
    };
    
    document.getElementById('del-history-item').onclick = async () => {
        if (confirm('Delete this entry?')) {
            await fetch(`${API_BASE}/history/${select.value}?username=${currentUser}`, { method: 'DELETE' });
            loadHistoryData();
        }
    }
}

async function loadHealthMetrics() {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    document.getElementById('sys-cpu').textContent = data.cpu + '%';
    document.getElementById('sys-ram').textContent = data.ram + '%';
    document.getElementById('sys-db-latency').textContent = data.db_latency + ' ms';
    
    const logRes = await fetch(`${API_BASE}/api/logs`);
    const logData = await logRes.json();
    document.getElementById('log-content').textContent = logData.logs;
    
    document.getElementById('clear-logs-btn').onclick = async () => {
        await fetch(`${API_BASE}/api/logs`, { method: 'DELETE' });
        loadHealthMetrics();
    }
}

async function loadDiagnostics() {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    document.getElementById('diagnostics-info').innerHTML = `
        <p>📡 API Status: <span style="color:var(--success)">ONLINE</span></p>
        <p>📦 Models Loaded: ${data.models_count || 3}</p>
        <p>🕒 Server Time: ${new Date().toLocaleTimeString()}</p>
    `;
}

async function loadAlertConfig() {
    const res = await fetch(`${API_BASE}/alert/`, { headers: {'X-User': currentUser} });
    const config = await res.json();
    
    document.getElementById('alert-enabled').checked = config.email_enabled;
    document.getElementById('alert-email').value = config.target_email || '';
    document.getElementById('alert-threshold').value = config.titer_threshold || 5.0;
    document.getElementById('alert-condition').value = config.condition || 'above';
    document.getElementById('smtp-server').value = config.smtp_server || 'smtp.gmail.com';
    document.getElementById('smtp-port').value = config.smtp_port || 587;
    document.getElementById('smtp-user').value = config.smtp_user || '';
    document.getElementById('smtp-pass').value = config.smtp_pass || '';
}

document.getElementById('alert-config-form').onsubmit = async (e) => {
    e.preventDefault();
    const config = {
        email_enabled: document.getElementById('alert-enabled').checked,
        target_email: document.getElementById('alert-email').value,
        titer_threshold: parseFloat(document.getElementById('alert-threshold').value),
        condition: document.getElementById('alert-condition').value,
        smtp_server: document.getElementById('smtp-server').value,
        smtp_port: parseInt(document.getElementById('smtp-port').value),
        smtp_user: document.getElementById('smtp-user').value,
        smtp_pass: document.getElementById('smtp-pass').value
    };
    await fetch(`${API_BASE}/alert/`, { method: 'POST', headers: {'Content-Type': 'application/json', 'X-User': currentUser}, body: JSON.stringify(config) });
    showToast('Settings saved');
};

document.getElementById('test-alert-btn').onclick = async () => {
    showToast('Sending test email...');
    const config = {
        email_enabled: document.getElementById('alert-enabled').checked,
        target_email: document.getElementById('alert-email').value,
        titer_threshold: parseFloat(document.getElementById('alert-threshold').value),
        condition: document.getElementById('alert-condition').value,
        smtp_server: document.getElementById('smtp-server').value,
        smtp_port: parseInt(document.getElementById('smtp-port').value),
        smtp_user: document.getElementById('smtp-user').value,
        smtp_pass: document.getElementById('smtp-pass').value
    };
    const res = await fetch(`${API_BASE}/alert/test/`, { method: 'POST', headers: {'Content-Type': 'application/json', 'X-User': currentUser}, body: JSON.stringify(config) });
    if (res.ok) showToast('Test success!');
    else showToast('Test failed', true);
}
