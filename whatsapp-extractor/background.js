// background.js — Service Worker for WA Group Extractor

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    isOn: false,
    contacts: {},
    groups: [],
    dupesSkipped: 0,
    logs: []
  });
  console.log('[WA Extractor] Installed & storage initialized');
});

// Relay messages between popup and content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Background download fallback (when content script unavailable)
  if (msg.type === 'DOWNLOAD_FROM_BG') {
    chrome.storage.local.get(['contacts', 'groups'], (data) => {
      const contacts = Object.values(data.contacts || {});
      if (contacts.length === 0) return;

      // Generate CSV as fallback (background can't use XLSX DOM APIs)
      const header = 'Name,Phone Number,Group,Added At\n';
      const rows = contacts.map(c =>
        `"${(c.name||'').replace(/"/g,'""')}","${(c.phone||'').replace(/"/g,'""')}","${(c.group||'').replace(/"/g,'""')}","${c.addedAt||''}"`
      ).join('\n');
      const csv = header + rows;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const filename = `WA_Contacts_${new Date().toISOString().split('T')[0]}.csv`;
      chrome.downloads.download({ url, filename, saveAs: false }, () => {
        URL.revokeObjectURL(url);
      });
    });
  }
});

// Keep service worker alive during extraction
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('web.whatsapp.com')) {
    chrome.storage.local.get(['isOn'], (data) => {
      if (data.isOn) {
        // Re-inject if needed (content scripts persist but just in case)
        chrome.tabs.sendMessage(tabId, { type: 'PING' }).catch(() => {});
      }
    });
  }
});
