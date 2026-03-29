// content/sidebar.js

class SidebarManager {
  async open(text) {
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        return;
      }
      
      await chrome.storage.local.set({ pendingTranslation: text });
      
      if (chrome.sidePanel) {
        try {
          const currentWindow = await chrome.windows.getCurrent();
          await chrome.sidePanel.open({ windowId: currentWindow.id });
        } catch (e) {
          console.log('SidePanel not available');
        }
      }
    } catch (error) {
      console.log('Sidebar error:', error);
    }
  }

  async close() {
    try {
      if (chrome.runtime && chrome.runtime.id) {
        await chrome.storage.local.remove('pendingTranslation');
      }
    } catch (error) {
      // 忽略错误
    }
  }
}
