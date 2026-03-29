// content/content.js

// 等待DOM加载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initContentScript);
} else {
  initContentScript();
}

function initContentScript() {
  console.log('Content script initializing...');
  
  // 检查chrome.runtime是否可用
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.error('Extension context not available');
    return;
  }
  
  const textProcessor = new TextProcessor();
  const floatingPopup = new FloatingPopup();
  const sidebarManager = new SidebarManager();
  let config = null;

  // 加载配置
  loadConfig();

  // 绑定事件
  bindEvents();

  // 监听来自background的消息
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    handleMessage(request, sender, sendResponse);
    return true;
  });

  console.log('Content script initialized');

  async function loadConfig() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      if (response.success) {
        config = response.data;
        textProcessor.wordThreshold = config.wordThreshold;
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  function bindEvents() {
    // 鼠标释放时检测划词
    document.addEventListener('mouseup', (e) => {
      if (config?.autoTranslate !== false) {
        setTimeout(() => handleSelection(e), 10);
      }
    });

    // 点击空白处关闭弹窗
    document.addEventListener('mousedown', (e) => {
      if (!floatingPopup.contains(e.target)) {
        floatingPopup.hide();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        floatingPopup.hide();
        sidebarManager.close();
      }
    });

    // 监听配置变化
    window.addEventListener('focus', loadConfig);
  }

  function handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'triggerTranslate':
        triggerTranslate();
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  function handleSelection(e) {
    const selection = window.getSelection();
    const result = textProcessor.analyzeSelection(selection);
    
    if (!result) {
      floatingPopup.hide();
      return;
    }

    if (result.isWord) {
      floatingPopup.show(result.text, result.position);
    } else {
      sidebarManager.open(result.text);
      floatingPopup.hide();
    }
  }

  function triggerTranslate() {
    const selection = window.getSelection();
    const result = textProcessor.analyzeSelection(selection);
    
    if (!result) return;

    if (result.isWord) {
      floatingPopup.show(result.text, result.position);
    } else {
      sidebarManager.open(result.text);
    }
  }
}
