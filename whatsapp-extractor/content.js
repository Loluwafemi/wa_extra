// content.js — WhatsApp Group Extractor Engine
// Injected into web.whatsapp.com

(function () {
  'use strict';

  if (window.__waExtractorLoaded) return;
  window.__waExtractorLoaded = true;

  let isOn = false;
  let currentGroupName = null;
  let extractionInProgress = false;
  let groupObserver = null;
  let urlCheckInterval = null;
  let groupMemberList = null;
  // ── HELPERS ─────────────────────────────────────────────────────────────────
  function log(msg, type = '') {
    chrome.runtime.sendMessage({ type: 'STATUS_UPDATE', log: msg, logType: type });
  }

  function status(groupName, statusMsg, progress, progressText) {
    chrome.runtime.sendMessage({
      type: 'STATUS_UPDATE',
      groupName,
      status: statusMsg,
      progress: progress !== undefined ? progress : null,
      progressText
    });
  }

  async function getStorage(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  }

  async function setStorage(obj) {
    return new Promise(resolve => chrome.storage.local.set(obj, resolve));
  }

  // ── DETECT GROUP FROM URL / DOM ──────────────────────────────────────────────
  function getCurrentGroupName() {
    // Try the active chat header
    const headerSel = [
      '[data-testid="conversation-header"] [data-testid="conversation-info-header-chat-title"] span',
      'header [data-testid="conversation-info-header"] span[dir="auto"]',
      '._21S-L span[title]',
      'header span[dir="auto"][title]',
      '[data-testid="conversation-panel-header"] span[dir]'
    ];
    for (const sel of headerSel) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim()) return el.textContent.trim();
    }
    return null;
  }

  function isGroupChat() {
      const header = document.querySelector('[data-testid="conversation-header"]');

      if (!header) return false;

      // 1. Group icon in header
      if (header.querySelector('[title="Profile details"]')) return true;

      // 2. Subtitle usually shows participants count or multiple names in groups
      const subtitle = header.querySelector('[data-testid="chat-subtitle"] span, span[title]');
      if (subtitle) {
        const text = subtitle.textContent || '';
        // Heuristic: groups often contain commas or participant counts
        if (text.includes(',') || /\d+\s+(participants|members)/i.test(text)) {
          return true;
        }
      }

      // 3. Fallback: multiple avatars in header (groups often show stacked icons)
      if (header.querySelector('svg[aria-label*="group"], img[src]')) {
        return true;
      }

      return false;


    // Group chats have a participants count or group icon
    // const groupIndicators = [
    //   '[data-testid="group-info-drawer"]',
    //   '[data-testid="conversation-info-header"] [data-testid="group-icon"]',
    //   'span[data-icon="group"]',
    //   '[data-testid="conversation-panel-header"] [data-testid="group"]'
    // ];
    // for (const sel of groupIndicators) {
    //   if (document.querySelector(sel)) return true;
    // }
    // // Check if subtitle contains member count (e.g. "You, Alice, Bob...")
    // const subtitleSel = [
    //   '[data-testid="conversation-info-header"] span.copyable-text span',
    //   'header ._3_7SH span',
    //   'header span._3-cMa'
    // ];
    // for (const sel of subtitleSel) {
    //   const el = document.querySelector(sel);
    //   if (el) {
    //     const t = el.textContent.trim();
    //     if (t.includes(',') || /\d+ member/i.test(t)) return true;
    //   }
    // }
    // return false;
  }

  // ── OPEN GROUP INFO PANEL ────────────────────────────────────────────────────
  async function openGroupInfoPanel() {
    // Click the group header to open the info panel
    const headerSelectors = [
      '[data-testid="conversation-header"] [role="button"]'
    ];
    for (const sel of headerSelectors) {
      const el = document.querySelector(sel);
      if (el) { el.click(); break; }
    }
    await sleep(1200);
  }

  async function closeGroupInfoPanel() {
    const closeSelectors = [
      '[data-testid="btn-closer-drawer"]',
      '[data-testid="group-info-drawer"] [data-testid="btn-closer"]',
      'span[data-icon="x"]'
    ];
    for (const sel of closeSelectors) {
      const el = document.querySelector(sel);
      if (el) { el.click(); break; }
    }
    await sleep(600);
  }

  // ── SCROLL MEMBER LIST ───────────────────────────────────────────────────────
  async function scrollMemberList(panelEl) {
    const scrollableEntry =  panelEl.querySelector('[data-testid="group-info-participants-section"] > div:first-child').click()
    
    const scrollable =  panelEl.querySelector('[data-testid="contacts-modal"]')

    
    const totalCapture = 30;
    for (let i = 0; i < totalCapture; i++) {
      scrollable.scrollTop += 500;
      await sleep(300);
    }
    // Scroll back to top to ensure all rendered
    scrollable.scrollTop = 0;
    await sleep(400);
    
    // close popup
    panelEl.querySelector('[data-testid="group-info-participants-section"] > div:first-child').click()

    await sleep(100);

  }

  // ── PARSE MEMBER NODES ───────────────────────────────────────────────────────
  async function parseMemberNodes(container) {

    // open popup
    container.querySelector('[data-testid="group-info-participants-section"] > div:first-child').click()

    await sleep(400);

    // read the popup
    const modalcontainer = document.querySelector('[data-testid="contacts-modal"] > div:last-of-type')


    const members = [];
    // Try multiple selectors for participant modalcontainer
    let rows = [];
    /* 
    scroll every the iterable parent, and while doing that, capture the rendered rows, then after scroll is done, pick from the captured rows. This is to ensure we capture all members even if they are not rendered at once due to lazy loading. We can adjust the scroll amount and delay as needed.    
    */
    
    let capturedRows = new Set();
    // pick the last element which is the scrollable container
    const totalCapture = 30;
    for (let i = 0; i < totalCapture; i++) {
      modalcontainer.scrollTop += 500;
      await sleep(300);
      // get the row, then pick the parent which is the row container, and add to captured rows set
      const newRows = modalcontainer.querySelector('[data-testid^="list-item-"]').closest('[tabindex="-1"] > div');


      newRows.childNodes.forEach(n => capturedRows.add(n));

    }
    // Scroll back to top to ensure all rendered
    modalcontainer.scrollTop = 0;
    await sleep(400);

    rows = Array.from(capturedRows);

    console.log('Captured rows:', rows.length);

    // loop through each row and extract name and phone
    rows.forEach(row => {
    console.log(row);
      
    // convert the element in the row to dom element that can be queried, because the rows are string when captured, we need to convert it back to dom element to query the name and phone

    const listItem = row.querySelector('[tabindex="-1"]');

    if (!listItem) {
      console.log('No list item found in row, skipping:', row);
      return;
    } else {
      console.log('list item found in row, skipping:', row);
    }; // skip invalid rows

    console.log('List item:', listItem);
    
    let isPlaceHolder = listItem.querySelector('[data-testid="section-header"]') !== null;


    if (isPlaceHolder) {
      console.log('Placeholder row, skipping:', listItem);
      return;
    } else {
      console.log('Valid member row:', listItem);
    }

      // Extract name
      let name = '';
      const nameSels = [
        '[data-testid^="list-item-"]'
      ];

      // debug with console.

      // extract the name
      for (const ns of nameSels) {
        const el = listItem.querySelector(ns).querySelector('[data-testid="cell-frame-title"]');
        if (el && el.textContent.trim()) { name = el.textContent.trim(); break; }
      }

      // Extract phone/secondary info (may be number or ~name if no number saved)
      let phone = '';
      const phoneSels = [
        '[role="gridcell"]:last-child'
      ];
      for (const ps of phoneSels) {
        const el = listItem.querySelector(ps);
        if (el && el.textContent.trim()) { phone = el.textContent.trim(); break; }
      }

      // Only include if have number
      if (name && name !== 'You' && phone) {
        // Clean phone: strip non-numeric except +
        const cleanPhone = phone.replace(/[^\d+\-\s()]/g, '').trim();
        members.push({
          name: name.trim(),
          phone: cleanPhone || 'N/A'
        });
      }
    });

    return members;
  }

  // ── CORE EXTRACTION ──────────────────────────────────────────────────────────
  async function extractGroupMembers(groupName) {
    if (extractionInProgress) return;
    extractionInProgress = true;

    status(groupName, 'Opening group info...', 5, 'Opening...');
    log(`Starting extraction: "${groupName}"`, 'ok');

    try {
      await openGroupInfoPanel();

      // Find the info panel
      const panelSels = [
        '[data-testid="group-info-drawer"]',
        '[data-testid="drawer-right"]',
        '#app div[tabindex="-1"][style*="transform"]',
        '._3q4NP'
      ];
      let panel = null;
      for (const sel of panelSels) {
        panel = document.querySelector(sel);
        if (panel) break;
      }

      if (!panel) {
        log('Could not open group info panel', 'err');
        status(groupName, 'Error: Could not open group info', null);
        extractionInProgress = false;
        return;
      }

      status(groupName, 'Scrolling to load all members...', 20, 'Loading members...');

      // check if list exceed scrollable number to decide action type
      // await scrollMemberList(panel);

      status(groupName, 'Parsing member data...', 60, 'Parsing...');
      await sleep(500);

      const members = await parseMemberNodes(panel);
      log(`Found ${members.length} visible members`, '');

      if (members.length === 0) {
        log('No members parsed — WhatsApp may have updated its UI. Contact customer support.', 'warn');
        status(groupName, 'Warning: No members found. See docs.', 80);
      }

      // ── SAVE TO STORAGE ────────────────────────────────────────────────────
      status(groupName, 'Saving data...', 80, 'Saving...');
      const stored = await getStorage(['contacts', 'groups', 'dupesSkipped']);
      let contacts     = stored.contacts     || {};
      let groups       = stored.groups       || [];
      let dupesSkipped = stored.dupesSkipped || 0;
      let newCount     = 0;

      members.forEach(m => {
        const key = m.phone !== 'N/A' ? m.phone : m.name;
        if (!contacts[key]) {
          contacts[key] = {
            name:  m.name,
            phone: m.phone,
            group: groupName,
            addedAt: new Date().toISOString()
          };
          newCount++;
        } else {
          dupesSkipped++;
        }
      });

      if (!groups.includes(groupName)) groups.push(groupName);

      await setStorage({ contacts, groups, dupesSkipped });

      status(groupName, `Done — ${newCount} new, ${dupesSkipped} dupes skipped`, 100, 'Complete!');
      log(`Saved ${newCount} new contacts from "${groupName}"`, 'ok');

      // Notify popup of stats
      chrome.runtime.sendMessage({
        type: 'STATS_UPDATE',
        contacts, groups, dupesSkipped
      });

      await sleep(800);
      await closeGroupInfoPanel();

    } catch (err) {
      log(`Error: ${err.message}`, 'err');
      status(groupName, `Error: ${err.message}`, null);
    }

    await sleep(500);
    status(groupName, 'Monitoring for next group...', null);
    extractionInProgress = false;
  }

  // ── MONITOR URL/GROUP CHANGES ────────────────────────────────────────────────
  let lastUrl = location.href;
  let lastGroup = null;
  let changeDebounce = null;

  function onGroupChange(groupName) {
    if (!isOn || !groupName || groupName === lastGroup) return;
    lastGroup = groupName;
    clearTimeout(changeDebounce);
    changeDebounce = setTimeout(() => {
      if (isGroupChat()) {
        extractGroupMembers(groupName);
      } else {
        status(groupName, 'Not a group chat — skipping', null);
        log(`"${groupName}" is not a group — skipping`, 'warn');
      }
    }, 1500);
  }

  function startMonitoring() {
    log('Monitoring started', 'ok');

    // Watch for URL changes (WhatsApp is SPA)
    urlCheckInterval = setInterval(() => {
      if (!isOn) return;
      const newUrl = location.href;
      const group  = getCurrentGroupName();

      if (newUrl !== lastUrl || group !== lastGroup) {
        lastUrl = newUrl;
        if (group) onGroupChange(group);
      }
    }, 1500);

    // Also observe DOM mutations for chat header changes
    groupObserver = new MutationObserver(() => {
      if (!isOn) return;
      const group = getCurrentGroupName();
      if (group && group !== lastGroup) onGroupChange(group);
    });
    const target = document.getElementById('main') || document.body;
    groupObserver.observe(target, { childList: true, subtree: true, characterData: false });

    // Check current state immediately
    const group = getCurrentGroupName();
    if (group) onGroupChange(group);
  }

  function stopMonitoring() {
    log('Monitoring stopped', 'warn');
    clearInterval(urlCheckInterval);
    if (groupObserver) { groupObserver.disconnect(); groupObserver = null; }
    lastGroup = null;
  }

  // ── DOWNLOAD EXCEL ───────────────────────────────────────────────────────────
  async function downloadExcel() {
    const stored = await getStorage(['contacts', 'groups']);
    const contacts = stored.contacts || {};
    const rows = Object.values(contacts);

    if (rows.length === 0) {
      log('No data to download', 'warn');
      return { ok: false };
    }

    try {
      // Use SheetJS (XLSX) bundled in the extension
      const wb = XLSX.utils.book_new();

      // ── All Contacts Sheet
      const wsData = [
        ['Name', 'Phone Number', 'Group', 'Added At'],
        ...rows.map(r => [r.name, r.phone, r.group, r.addedAt])
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 35 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, 'All Contacts');

      // ── Per-Group Sheets
      const groups = stored.groups || [];
      groups.forEach(grp => {
        const grpRows = rows.filter(r => r.group === grp);
        if (grpRows.length === 0) return;
        const sheetName = grp.substring(0, 31).replace(/[\\/:*?[\]]/g, '_');
        const grpData = [
          ['Name', 'Phone Number', 'Added At'],
          ...grpRows.map(r => [r.name, r.phone, r.addedAt])
        ];
        const grpWs = XLSX.utils.aoa_to_sheet(grpData);
        grpWs['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, grpWs, sheetName);
      });

      // Trigger download
      const filename = `WA_Contacts_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);

      log(`Downloaded: ${filename} (${rows.length} contacts)`, 'ok');
      return { ok: true };
    } catch (e) {
      log(`Download error: ${e.message}`, 'err');
      return { ok: false, error: e.message };
    }
  }

  // ── MESSAGE LISTENER ─────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'TOGGLE') {
      isOn = msg.isOn;
      if (isOn) startMonitoring();
      else stopMonitoring();
      sendResponse({ ok: true });
    }

    if (msg.type === 'DOWNLOAD') {
      downloadExcel().then(sendResponse);
      return true; // async
    }
  });

  // ── RESTORE STATE ON LOAD ────────────────────────────────────────────────────
  chrome.storage.local.get(['isOn'], (data) => {
    isOn = data.isOn || false;
    if (isOn) startMonitoring();
  });

  // ── UTILS ────────────────────────────────────────────────────────────────────
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

})();
