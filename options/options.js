// options/options.js

const ENGINE_DEFAULTS = {
  'ollama': { apiUrl: 'http://localhost:11434' },
  'vllm': { apiUrl: 'http://localhost:8000' },
  'lmstudio': { apiUrl: 'http://localhost:1234' },
  'litellm': { apiUrl: 'http://localhost:4000' }
};

const DEFAULT_CONFIG = {
  engineType: 'ollama',
  apiUrl: 'http://localhost:11434',
  modelName: 'qwen2.5:7b',
  sourceLanguages: ['英文'],
  targetLanguage: '中文',
  ttsRate: 1.0,
  autoTranslate: true,
  wordThreshold: 20
};

document.addEventListener('DOMContentLoaded', () => {
  console.log('Options page loaded');
  
  // 检查chrome.runtime是否可用
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.error('Extension context not available. Are you opening this page directly?');
    document.body.innerHTML = '<div style="padding: 20px; color: red;">错误：必须通过扩展管理页面打开此设置页面</div>';
    return;
  }
  
  initOptionsPage();
});

async function initOptionsPage() {
  try {
    await loadConfig();
    bindEvents();
    updateEngineDefaults();
    console.log('Options page initialized');
  } catch (error) {
    console.error('Failed to initialize options page:', error);
  }
}

function bindEvents() {
  document.getElementById('engineType').addEventListener('change', updateEngineDefaults);
  
  document.getElementById('ttsRate').addEventListener('input', (e) => {
    document.getElementById('ttsRateValue').textContent = e.target.value + 'x';
  });

  document.getElementById('testConnectionBtn').addEventListener('click', testConnection);
  document.getElementById('testTtsBtn').addEventListener('click', testTTS);
  document.getElementById('clearCacheBtn').addEventListener('click', clearCache);
  document.getElementById('saveBtn').addEventListener('click', saveConfig);
  document.getElementById('resetBtn').addEventListener('click', resetConfig);
}

function updateEngineDefaults() {
  const engineType = document.getElementById('engineType').value;
  const defaults = ENGINE_DEFAULTS[engineType];
  const apiUrlInput = document.getElementById('apiUrl');
  
  if (!apiUrlInput.dataset.userModified) {
    apiUrlInput.value = defaults.apiUrl;
  }

  const modelSuggestions = {
    ollama: 'qwen2.5:7b',
    vllm: 'meta-llama/Llama-2-7b-chat-hf',
    lmstudio: 'local-model',
    litellm: 'gpt-3.5-turbo'
  };
  
  const modelInput = document.getElementById('modelName');
  if (!modelInput.value) {
    modelInput.placeholder = modelSuggestions[engineType];
  }
}

async function loadConfig() {
  try {
    console.log('Loading config...');
    const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
    console.log('Config loaded:', response);
    
    if (response.success) {
      populateForm(response.data);
    } else {
      populateForm(DEFAULT_CONFIG);
    }
  } catch (error) {
    console.error('Failed to load config:', error);
    populateForm(DEFAULT_CONFIG);
  }
}

function populateForm(config) {
  document.getElementById('engineType').value = config.engineType || DEFAULT_CONFIG.engineType;
  document.getElementById('apiUrl').value = config.apiUrl || DEFAULT_CONFIG.apiUrl;
  document.getElementById('apiUrl').dataset.userModified = 'true';
  document.getElementById('modelName').value = config.modelName || DEFAULT_CONFIG.modelName;
  document.getElementById('targetLanguage').value = config.targetLanguage || DEFAULT_CONFIG.targetLanguage;
  document.getElementById('ttsRate').value = config.ttsRate || DEFAULT_CONFIG.ttsRate;
  document.getElementById('ttsRateValue').textContent = (config.ttsRate || DEFAULT_CONFIG.ttsRate) + 'x';
  document.getElementById('autoTranslate').checked = config.autoTranslate !== false;
  document.getElementById('wordThreshold').value = config.wordThreshold || DEFAULT_CONFIG.wordThreshold;

  const sourceLangs = config.sourceLanguages || ['英文'];
  document.querySelectorAll('#sourceLanguages input').forEach(checkbox => {
    checkbox.checked = sourceLangs.includes(checkbox.value);
  });
}

function collectFormData() {
  const sourceLanguages = [];
  document.querySelectorAll('#sourceLanguages input:checked').forEach(checkbox => {
    sourceLanguages.push(checkbox.value);
  });

  return {
    engineType: document.getElementById('engineType').value,
    apiUrl: document.getElementById('apiUrl').value.trim(),
    modelName: document.getElementById('modelName').value.trim(),
    sourceLanguages: sourceLanguages.length > 0 ? sourceLanguages : ['英文'],
    targetLanguage: document.getElementById('targetLanguage').value,
    ttsRate: parseFloat(document.getElementById('ttsRate').value),
    autoTranslate: document.getElementById('autoTranslate').checked,
    wordThreshold: parseInt(document.getElementById('wordThreshold').value)
  };
}

async function saveConfig() {
  const config = collectFormData();
  
  try {
    console.log('Saving config:', config);
    const response = await chrome.runtime.sendMessage({
      action: 'setConfig',
      config: config
    });

    const statusEl = document.getElementById('saveStatus');
    if (response.success) {
      statusEl.textContent = '设置已保存!';
      statusEl.className = 'save-status success';
    } else {
      statusEl.textContent = '保存失败，请重试';
      statusEl.className = 'save-status error';
    }
    
    setTimeout(() => {
      statusEl.textContent = '';
      statusEl.className = 'save-status';
    }, 3000);
  } catch (error) {
    console.error('Failed to save config:', error);
    const statusEl = document.getElementById('saveStatus');
    statusEl.textContent = '保存失败: ' + error.message;
    statusEl.className = 'save-status error';
  }
}

async function testConnection() {
  const statusEl = document.getElementById('connectionStatus');
  statusEl.textContent = '测试连接中...';
  statusEl.className = 'status testing';

  try {
    console.log('Testing connection...');
    const response = await chrome.runtime.sendMessage({ action: 'testConnection' });
    console.log('Connection test result:', response);
    
    if (response.success && response.connected) {
      statusEl.textContent = '连接成功!';
      statusEl.className = 'status success';
    } else {
      statusEl.textContent = '连接失败，请检查模型是否运行';
      statusEl.className = 'status error';
    }
  } catch (error) {
    console.error('Test connection error:', error);
    statusEl.textContent = '测试失败：' + error.message;
    statusEl.className = 'status error';
  }
}

function testTTS() {
  const text = 'Hello, this is a test.';
  const rate = parseFloat(document.getElementById('ttsRate').value);
  
  try {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    speechSynthesis.speak(utterance);
  } catch (error) {
    alert('您的浏览器不支持语音朗读功能');
  }
}

async function clearCache() {
  try {
    const all = await chrome.storage.local.get(null);
    const cacheKeys = Object.keys(all).filter(k => k.startsWith('cache:'));
    await chrome.storage.local.remove(cacheKeys);
    
    const statusEl = document.getElementById('cacheStatus');
    statusEl.textContent = `已清除 ${cacheKeys.length} 条缓存`;
    setTimeout(() => {
      statusEl.textContent = '';
    }, 3000);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

function resetConfig() {
  if (confirm('确定要恢复默认设置吗？')) {
    populateForm(DEFAULT_CONFIG);
  }
}
