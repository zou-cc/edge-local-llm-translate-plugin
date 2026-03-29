// content/sidebar.js

export class SidebarManager {
  async open(text) {
    try {
      // 保存待翻译文本到storage
      await chrome.storage.local.set({ pendingTranslation: text });
      
      // 打开侧边栏
      await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
    } catch (error) {
      console.error('Failed to open side panel:', error);
      // Fallback: 尝试通过消息传递
      this.fallbackOpen(text);
    }
  }

  fallbackOpen(text) {
    // 如果Side Panel API不可用，尝试其他方式
    chrome.runtime.sendMessage({
      action: 'translateInSidePanel',
      text: text
    }).catch(error => {
      console.error('Fallback open failed:', error);
    });
  }

  async close() {
    try {
      // Side Panel API没有直接关闭方法，用户需要手动关闭
      // 但我们可以清除待翻译状态
      await chrome.storage.local.remove('pendingTranslation');
    } catch (error) {
      console.error('Failed to close side panel:', error);
    }
  }
}

export default SidebarManager;
