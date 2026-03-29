// background/background.js
import configManager from './config-manager.js';
import llmClient from './llm-client.js';
import { generateCacheKey, parseWordTranslation, parseSentenceTranslation } from '../shared/utils.js';

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
        console.log('=== Translate request received ===', request);
        const result = await handleTranslate(request.text, request.isWord, request.targetLang);
        console.log('=== Translate result ===', result);
        sendResponse(result);
        break;
        
      case 'testConnection':
        const connected = await llmClient.testConnection();
        sendResponse({ success: true, connected });
        break;
        
      case 'clearCache':
        // 清除所有缓存
        const all = await chrome.storage.local.get(null);
        const cacheKeys = Object.keys(all).filter(k => k.startsWith('cache:'));
        await chrome.storage.local.remove(cacheKeys);
        sendResponse({ success: true, count: cacheKeys.length });
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
  console.log('=== handleTranslate called ===');
  console.log('Text:', text);
  console.log('isWordMode:', isWordMode);
  console.log('targetLang:', targetLang);
  
  // 检查缓存
  const cacheKey = generateCacheKey(text, isWordMode ? 'word' : 'sentence', targetLang);
  console.log('Cache key:', cacheKey);
  
  const cached = await configManager.getCache(cacheKey);
  
  if (cached) {
    console.log('Cache hit:', cached);
    // 如果缓存的是空结果，重新翻译
    if (!cached.meaning || cached.meaning === '无翻译结果') {
      console.log('Cached result is empty, retranslating...');
      await chrome.storage.local.remove('cache:' + cacheKey);
    } else {
      return { success: true, data: cached, fromCache: true };
    }
  }

  // 调用LLM翻译
  console.log('Calling LLM...');
  const result = await llmClient.translate(text, isWordMode, targetLang);
  console.log('LLM result:', result);
  
  if (result.success) {
    // 解析响应
    let parsed;
    if (isWordMode) {
      console.log('Parsing word translation...');
      parsed = parseWordTranslation(result.data);
    } else {
      console.log('Parsing sentence translation...');
      parsed = { translation: parseSentenceTranslation(result.data) };
    }
    
    console.log('Parsed result:', parsed);
    
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
