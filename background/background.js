// background/background.js
import configManager from './config-manager.js';
import llmClient from './llm-client.js';
import { generateCacheKey, isWord, parseWordTranslation, parseSentenceTranslation } from '../shared/utils.js';

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
        
      case 'translate':
        const result = await handleTranslate(request.text, request.isWord, request.targetLang);
        sendResponse(result);
        break;
        
      case 'testConnection':
        const connected = await llmClient.testConnection();
        sendResponse({ success: true, connected });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleTranslate(text, isWordMode, targetLang) {
  // 检查缓存
  const cacheKey = generateCacheKey(text, isWordMode ? 'word' : 'sentence', targetLang);
  const cached = await configManager.getCache(cacheKey);
  
  if (cached) {
    console.log('Cache hit for:', text);
    return { success: true, data: cached, fromCache: true };
  }

  // 调用LLM翻译
  const result = await llmClient.translate(text, isWordMode, targetLang);
  
  if (result.success) {
    // 解析响应
    let parsed;
    if (isWordMode) {
      parsed = parseWordTranslation(result.data);
    } else {
      parsed = { translation: parseSentenceTranslation(result.data) };
    }
    
    // 保存到缓存
    await configManager.setCache(cacheKey, parsed);
    
    return { success: true, data: parsed };
  }
  
  return result;
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
