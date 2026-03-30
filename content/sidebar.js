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
          console.log('Trying to open side panel...');
          
          await chrome.sidePanel.open();
          console.log('Side panel opened successfully');
        } catch (e) {
          console.error('SidePanel.open() failed:', e);
          // 回退：打开新标签页
          this.openAsTab();
        }
      } else {
        console.log('chrome.sidePanel API not available, trying tab fallback');
        this.openAsTab();
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
  
  async openAsTab() {
    try {
      // 通过 background script 打开标签页
      const response = await chrome.runtime.sendMessage({
        action: 'openSidebarTab'
      });
      console.log('Sidebar tab opened:', response);
    } catch (e) {
      console.error('Failed to open tab via background:', e);
    }
  }
}
