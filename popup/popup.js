// popup/popup.js

const log = (msg) => {
  const debugEl = document.getElementById('debugInfo');
  debugEl.style.display = 'block';
  debugEl.textContent += msg + '\n';
};

const setStatus = (id, text, cls) => {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = 'status ' + (cls || '');
};

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  await loadConfig();
  bindEvents();
});

async function loadConfig() {
  try {
    const r = await chrome.runtime.sendMessage({ action: 'getConfig' });
    if (r && r.success && r.data) {
      document.getElementById('apiUrl').value = r.data.apiUrl || 'http://localhost:11435';
      document.getElementById('apiKey').value = r.data.apiKey || '';
      document.getElementById('modelName').value = r.data.modelName || 'qwen3.5-35b';
    }
  } catch (e) {
    console.error('loadConfig error:', e);
  }
}

function bindEvents() {
  document.getElementById('testBtn').addEventListener('click', testConnection);
  document.getElementById('testTranslateBtn').addEventListener('click', testTranslate);
  document.getElementById('saveBtn').addEventListener('click', saveConfig);
}

async function testConnection() {
  setStatus('connectionStatus', '测试中...');
  try {
    const response = await chrome.runtime.sendMessage({ action: 'testConnection' });
    if (response && response.success && response.connected) {
      setStatus('connectionStatus', '✓ 连接成功', 'success');
    } else {
      setStatus('connectionStatus', '✗ 连接失败', 'error');
    }
  } catch (error) {
    setStatus('connectionStatus', '错误: ' + error.message, 'error');
  }
}

async function testTranslate() {
  setStatus('translateStatus', '翻译中...');
  document.getElementById('debugInfo').style.display = 'block';
  document.getElementById('debugInfo').textContent = '';
  log('开始测试翻译...');
  try {
    log('发送翻译请求: hello');
    const response = await chrome.runtime.sendMessage({
      action: 'translate',
      text: 'hello',
      isWord: true,
      targetLang: '中文'
    });
    log('收到响应: ' + JSON.stringify(response).substring(0, 300));
    if (response && response.success) {
      const translation = response.data.meaning || response.data.translation || '无结果';
      setStatus('translateStatus', '翻译: ' + translation, 'success');
      log('翻译成功: ' + translation);
    } else {
      setStatus('translateStatus', '失败: ' + (response?.error || '未知错误'), 'error');
      log('翻译失败: ' + (response?.error || '未知错误'));
    }
  } catch (error) {
    setStatus('translateStatus', '错误: ' + error.message, 'error');
    log('错误: ' + error.message);
  }
}

async function saveConfig() {
  let engineType = 'shimmy';
  try {
    const r = await chrome.runtime.sendMessage({ action: 'getConfig' });
    if (r && r.success && r.data && r.data.engineType) {
      engineType = r.data.engineType;
    }
  } catch (e) {}

  const config = {
    engineType: engineType,
    apiUrl: document.getElementById('apiUrl').value.trim(),
    apiKey: document.getElementById('apiKey').value.trim(),
    modelName: document.getElementById('modelName').value.trim(),
    targetLanguage: '中文',
    ttsRate: 1.0,
    sourceLanguages: ['英文'],
    autoTranslate: true,
    wordThreshold: 50
  };

  try {
    const response = await chrome.runtime.sendMessage({ action: 'setConfig', config });
    if (response && response.success) {
      setStatus('saveStatus', '保存成功!', 'success');
    } else {
      setStatus('saveStatus', '保存失败', 'error');
    }
    setTimeout(() => setStatus('saveStatus', ''), 3000);
  } catch (error) {
    setStatus('saveStatus', '错误: ' + error.message, 'error');
  }
}
