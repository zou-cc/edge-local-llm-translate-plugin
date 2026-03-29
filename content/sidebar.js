// content/sidebar.js

class SidebarManager {
  async open(text) {
    try {
      // 检查扩展上下文是否有效
      if (!chrome.runtime || !chrome.runtime.id) {
        console.log('Extension context not available');
        return;
      }
      
      await chrome.storage.local.set({ pendingTranslation: text });
      await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
    } catch (error) {
      if (error.message && error.message.includes('Extension context invalidated')) {
        console.log('Extension context invalidated');
      } else {
        console.error('Failed to open side panel:', error);
      }
    }
  }

  async close() {
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        return;
      }
      await chrome.storage.local.remove('pendingTranslation');
    } catch (error) {
      // 忽略错误
    }
  }
}
