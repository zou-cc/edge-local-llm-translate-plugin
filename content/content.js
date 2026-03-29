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
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) {
    console.error('Extension context not available');
    return;
  }
  
  const textProcessor = new TextProcessor();
  const floatingPopup = new FloatingPopup();
  const sidebarManager = new SidebarManager();
  let config = null;
  let isContextValid = true;

  // 加载配置
  loadConfig();

  // 绑定事件
  bindEvents();

  // 监听来自background的消息
  try {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      handleMessage(request, sender, sendResponse);
      return true;
    });
  } catch (e) {
    console.error('Failed to add message listener:', e);
    isContextValid = false;
  }

  console.log('Content script initialized');

  function isExtensionContextValid() {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.runtime.id &&
           isContextValid;
  }

  async function loadConfig() {
    if (!isExtensionContextValid()) {
      console.log('Extension context not available');
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      if (response && response.success) {
        config = response.data;
        textProcessor.wordThreshold = config.wordThreshold;
      }
    } catch (error) {
      if (error.message && error.message.includes('Extension context invalidated')) {
        console.log('Extension context invalidated');
        isContextValid = false;
      } else {
        console.error('Failed to load config:', error);
      }
    }
  }

  function bindEvents() {
    // 鼠标释放时检测划词
    document.addEventListener('mouseup', (e) => {
      if (!isExtensionContextValid()) {
        console.log('Extension context invalid, skipping selection');
        return;
      }
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
    window.addEventListener('focus', () => {
      if (isExtensionContextValid()) {
        loadConfig();
      }
    });
  }

  function handleMessage(request, sender, sendResponse) {
    if (!isExtensionContextValid()) {
      sendResponse({ success: false, error: 'Extension context invalid' });
      return;
    }
    
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
    if (!isExtensionContextValid()) {
      console.log('Extension context invalid');
      return;
    }
    
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
    if (!isExtensionContextValid()) {
      console.log('Extension context invalid');
      return;
    }
    
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
