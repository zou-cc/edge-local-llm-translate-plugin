// content/sidebar.js

class SidebarManager {
  async open(text) {
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        console.log('Extension context not available');
        return;
      }
      
      // 保存待翻译文本
      await chrome.storage.local.set({ pendingTranslation: text });
      
      // 尝试打开侧边栏
      if (chrome.sidePanel) {
        await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
      } else {
        console.log('SidePanel not available');
        this.showFallback(text);
      }
    } catch (error) {
      console.error('Failed to open side panel:', error);
      this.showFallback(text);
    }
  }

  showFallback(text) {
    // 创建简单的提示
    alert('选中 ' + text.length + ' 个字符，使用单词弹窗翻译长文本');
  }

  async close() {
    try {
      if (chrome.runtime && chrome.runtime.id) {
        await chrome.storage.local.remove('pendingTranslation');
      }
    } catch (error) {
      console.log('Close error:', error);
    }
  }
}
