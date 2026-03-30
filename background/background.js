// background/background.js
import configManager from './config-manager.js';
import llmClient from './llm-client.js';

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('=== Message received ===', request.action);
  handleMessage(request, sender, sendResponse);
  return true;
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
        console.log('=== Handling translate ===');
        console.log('Request:', request);
        
        const result = await llmClient.translate(
          request.text, 
          request.isWord, 
          request.targetLang
        );
        
        console.log('LLM result:', result);
        
        if (result.success) {
          // 直接使用 LLM 返回的内容
          const responseText = result.data;
          
          // 简单的解析
          let meaning = responseText.trim();
          
          // 如果是 thinking 模式，尝试提取实际翻译
          if (meaning.includes('Thinking Process:')) {
            const lines = meaning.split('\n').filter(l => l.trim());
            // 找到非空、非 thinking 的行
            for (const line of lines) {
              if (!line.includes('Thinking') && 
                  !line.includes('思考') && 
                  !line.includes('Process') &&
                  line.trim().length > 0 &&
                  line.trim().length < 200) {
                meaning = line.trim();
                break;
              }
            }
          }
          
          console.log('Final translation:', meaning);
          
          sendResponse({
            success: true,
            data: {
              meaning: meaning,
              raw: responseText
            }
          });
        } else {
          sendResponse(result);
        }
        break;
        
      case 'testConnection':
        const connected = await llmClient.testConnection();
        sendResponse({ success: true, connected });
        break;
        
      case 'openSidebarTab':
        const extensionId = chrome.runtime.id;
        const url = `chrome-extension://${extensionId}/sidepanel/sidepanel.html`;
        console.log('Creating sidebar tab:', url);
        
        const tab = await chrome.tabs.create({ url: url, active: true });
        sendResponse({ success: true, tabId: tab.id });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

console.log('Background script loaded');
