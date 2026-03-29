// content/sidebar.js

class SidebarManager {
  async open(text) {
    try {
      if (!chrome.runtime || !chrome.runtime.id) {
        return;
      }
      
      // 保存待翻译文本
      await chrome.storage.local.set({ pendingTranslation: text });
      
      // 尝试打开侧边栏（如果可用）
      if (chrome.sidePanel && chrome.windows) {
        try {
          const currentWindow = await chrome.windows.getCurrent();
          await chrome.sidePanel.open({ windowId: currentWindow.id });
          return; // 成功打开侧边栏，直接返回
        } catch (e) {
          // 侧边栏打开失败，使用单词弹窗作为 fallback
        }
      }
      
      // 如果侧边栏不可用或打开失败，使用单词弹窗
      // 不需要额外操作，因为 floating-popup 会处理
      console.log('Using word popup for long text');
      
    } catch (error) {
      // 静默处理错误
    }
  }

  async close() {
    try {
      if (chrome.runtime && chrome.runtime.id) {
        await chrome.storage.local.remove('pendingTranslation');
      }
    } catch (error) {
      // 静默处理
    }
  }
}
