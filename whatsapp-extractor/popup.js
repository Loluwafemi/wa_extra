// popup.js — WA Group Extractor UI Controller

const toggle       = document.getElementById('mainToggle');
const statusDot    = document.getElementById('statusDot');
const toggleText   = document.getElementById('toggleText');
const idleMsg      = document.getElementById('idleMsg');
const activeStatus = document.getElementById('activeStatus');
const groupNameDisplay = document.getElementById('groupNameDisplay');
const extractionStatus = document.getElementById('extractionStatus');
const progressWrap = document.getElementById('progressWrap');
const progressBar  = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const statContacts = document.getElementById('statContacts');
const statGroups   = document.getElementById('statGroups');
const statDupes    = document.getElementById('statDupes');
const logBox       = document.getElementById('logBox');
const btnDownload  = document.getElementById('btnDownload');
const btnClear     = document.getElementById('btnClear');
const notWaView    = document.getElementById('notWaView');
const mainView     = document.getElementById('mainView');

let logEntries = [];

function ts() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}

function addLog(msg, type = '') {
  logEntries.push({ msg, type, time: ts() });
  if (logEntries.length > 50) logEntries.shift();
  renderLog();
}

function renderLog() {
  if (!logEntries.length) {
    logBox.innerHTML = '<div class="log-entry">— Ready —</div>';
    return;
  }
  logBox.innerHTML = logEntries.slice().reverse().map(e =>
    `<div class="log-entry ${e.type}">
      <span class="log-timestamp">[${e.time}]</span>${e.msg}
    </div>`
  ).join('');
}

function updateToggleUI(isOn) {
  statusDot.classList.toggle('active', isOn);
  toggleText.textContent = isOn ? 'MONITORING ON' : 'MONITORING OFF';
  toggleText.classList.toggle('active', isOn);
  if (!isOn) {
    idleMsg.style.display = 'flex';
    activeStatus.style.display = 'none';
    progressWrap.style.display = 'none';
    progressText.style.display = 'none';
  } else {
    idleMsg.style.display = 'none';
    activeStatus.style.display = 'block';
  }
}

function updateStats(data) {
  const contacts = data.contacts || {};
  const groups   = data.groups || [];
  const dupes    = data.dupesSkipped || 0;
  const total    = Object.keys(contacts).length;
  statContacts.textContent = total;
  statGroups.textContent   = groups.length;
  statDupes.textContent    = dupes;
  btnDownload.disabled = total === 0;
  btnClear.disabled    = total === 0;
}

function setProgress(pct, text) {
  progressWrap.style.display = pct !== null ? 'block' : 'none';
  progressText.style.display = pct !== null ? 'block' : 'none';
  if (pct !== null) {
    progressBar.style.width = `${Math.min(100, pct)}%`;
    progressBar.classList.toggle('progress-shimmer', pct < 100);
    progressText.textContent = text || `${Math.round(pct)}%`;
  }
}

// ── CHECK CURRENT TAB ────────────────────────────────────────────────────────
async function checkCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url || !tab.url.includes('web.whatsapp.com')) {
    notWaView.style.display = 'block';
    mainView.style.display  = 'none';
    return false;
  }
  notWaView.style.display = 'none';
  mainView.style.display  = 'block';
  return true;
}

// ── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  const onWa = await checkCurrentTab();
  if (!onWa) return;

  // Load persisted state
  chrome.storage.local.get(['isOn','contacts','groups','dupesSkipped','logs'], (data) => {
    const isOn = data.isOn || false;
    toggle.checked = isOn;
    updateToggleUI(isOn);
    updateStats(data);
    if (data.logs) {
      logEntries = data.logs;
      renderLog();
    }
  });
}

// ── TOGGLE HANDLER ───────────────────────────────────────────────────────────
toggle.addEventListener('change', async () => {
  const isOn = toggle.checked;
  updateToggleUI(isOn);

  chrome.storage.local.set({ isOn }, async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.includes('web.whatsapp.com')) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', isOn });
        addLog(isOn ? 'Monitoring started' : 'Monitoring stopped', isOn ? 'ok' : 'warn');
      } catch (e) {
        // Content script not ready yet — it will pick up isOn from storage on load
        addLog('Waiting for WhatsApp to load...', 'warn');
      }
    }
  });
});

// ── DOWNLOAD HANDLER ─────────────────────────────────────────────────────────
btnDownload.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.url && tab.url.includes('web.whatsapp.com')) {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'DOWNLOAD' });
      if (response && response.ok) addLog('Excel file downloaded', 'ok');
    } catch (e) {
      // Trigger download from background via storage data
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_FROM_BG' });
      addLog('Downloading from stored data...', 'ok');
    }
  } else {
    chrome.runtime.sendMessage({ type: 'DOWNLOAD_FROM_BG' });
    addLog('Downloaded from storage', 'ok');
  }
  saveLog();
});

// ── CLEAR HANDLER ────────────────────────────────────────────────────────────
btnClear.addEventListener('click', () => {
  if (!confirm('Clear all extracted contact data?')) return;
  chrome.storage.local.set({ contacts: {}, groups: [], dupesSkipped: 0 }, () => {
    updateStats({ contacts: {}, groups: [], dupesSkipped: 0 });
    logEntries = [];
    addLog('Data cleared', 'warn');
    saveLog();
  });
});

// ── LISTEN FOR MESSAGES FROM CONTENT SCRIPT ──────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATUS_UPDATE') {
    if (msg.groupName) {
      groupNameDisplay.textContent = msg.groupName;
      activeStatus.style.display = 'block';
      idleMsg.style.display = 'none';
    }
    if (msg.status) extractionStatus.textContent = msg.status;
    if (typeof msg.progress === 'number') {
      setProgress(msg.progress, msg.progressText);
    } else {
      setProgress(null);
    }
    if (msg.log) addLog(msg.log, msg.logType || '');
  }

  if (msg.type === 'STATS_UPDATE') {
    updateStats(msg);
    saveLog();
  }
});

function saveLog() {
  chrome.storage.local.set({ logs: logEntries.slice(-50) });
}

init();
