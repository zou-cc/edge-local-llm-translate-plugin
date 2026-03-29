// background/background.js
import configManager from './config-manager.js';

// 安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // 保持消息通道开放
});

async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'getConfig':
        const config = await configManager.getConfig();
        sendResponse({ success: true, data: config });
        break;
        
      case 'setConfig':
        const saved = await configManager.setConfig(request.config);
        sendResponse({ success: saved });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 监听快捷键
chrome.commands.onCommand.addListener((command) => {
  if (command === 'translate-selection') {
    translateCurrentSelection();
  }
});

async function translateCurrentSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { action: 'triggerTranslate' });
    }
  } catch (error) {
    console.error('Failed to trigger translation:', error);
  }
}

console.log('Background service worker started');
