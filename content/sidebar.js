// content/sidebar.js

class SidebarManager {
  async open(text) {
    try {
      await chrome.storage.local.set({ pendingTranslation: text });
      await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
    } catch (error) {
      console.error('Failed to open side panel:', error);
    }
  }

  async close() {
    try {
      await chrome.storage.local.remove('pendingTranslation');
    } catch (error) {
      console.error('Failed to close side panel:', error);
    }
  }
}
