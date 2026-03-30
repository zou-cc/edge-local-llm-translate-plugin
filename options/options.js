// options.js - 外部脚本文件

const DEFAULT_CONFIG = {
  engineType: 'ollama',
  apiUrl: 'http://localhost:11434',
  modelName: 'qwen3.5:35b',
  sourceLanguages: ['英文'],
  targetLanguage: '中文',
  ttsRate: 1.0,
  autoTranslate: true,
  wordThreshold: 20
};

const ENGINE_DEFAULTS = {
  'ollama': { apiUrl: 'http://localhost:11434' },
  'vllm': { apiUrl: 'http://localhost:8000' },
  'lmstudio': { apiUrl: 'http://localhost:1234' },
  'litellm': { apiUrl: 'http://localhost:4000' },
  'shimmy': { apiUrl: 'http://localhost:11435' }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
  console.log('Options page loaded');
  initPage();
});

function initPage() {
  loadConfig();
  bindEvents();
}

function bindEvents() {
  // 引擎类型变化
  document.getElementById('engineType').addEventListener('change', function() {
    updateEngineDefaults();
  });
  
  // 语速滑块
  document.getElementById('ttsRate').addEventListener('input', function(e) {
    document.getElementById('ttsRateValue').textContent = e.target.value + 'x';
  });
  
  // 测试连接
  document.getElementById('testConnectionBtn').addEventListener('click', function() {
    testConnection();
  });
  
  // 保存
  document.getElementById('saveBtn').addEventListener('click', function() {
    saveConfig();
  });
  
  // 重置
  document.getElementById('resetBtn').addEventListener('click', function() {
    if (confirm('确定要恢复默认设置吗？')) {
      populateForm(DEFAULT_CONFIG);
    }
  });
}

function updateEngineDefaults() {
  var engineType = document.getElementById('engineType').value;
  var defaults = ENGINE_DEFAULTS[engineType];
  var apiUrlInput = document.getElementById('apiUrl');
  
  if (!apiUrlInput.dataset.userModified) {
    apiUrlInput.value = defaults.apiUrl;
  }
}

function loadConfig() {
  chrome.runtime.sendMessage({ action: 'getConfig' })
    .then(function(response) {
      if (response.success) {
        populateForm(response.data);
      }
    })
    .catch(function(error) {
      console.error('Failed to load config:', error);
      populateForm(DEFAULT_CONFIG);
    });
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

  // 设置源语言
  var sourceLangs = config.sourceLanguages || ['英文'];
  var checkboxes = document.querySelectorAll('#sourceLanguages input');
  for (var i = 0; i < checkboxes.length; i++) {
    checkboxes[i].checked = sourceLangs.indexOf(checkboxes[i].value) !== -1;
  }
}

function collectFormData() {
  var sourceLanguages = [];
  var checkboxes = document.querySelectorAll('#sourceLanguages input:checked');
  for (var i = 0; i < checkboxes.length; i++) {
    sourceLanguages.push(checkboxes[i].value);
  }

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

function saveConfig() {
  var config = collectFormData();
  
  chrome.runtime.sendMessage({ action: 'setConfig', config: config })
    .then(function(response) {
      var statusEl = document.getElementById('saveStatus');
      if (response.success) {
        statusEl.textContent = '设置已保存!';
        statusEl.className = 'save-status success';
      } else {
        statusEl.textContent = '保存失败，请重试';
        statusEl.className = 'save-status error';
      }
      
      setTimeout(function() {
        statusEl.textContent = '';
        statusEl.className = 'save-status';
      }, 3000);
    })
    .catch(function(error) {
      console.error('Failed to save config:', error);
      var statusEl = document.getElementById('saveStatus');
      statusEl.textContent = '保存失败: ' + error.message;
      statusEl.className = 'save-status error';
    });
}

function testConnection() {
  var statusEl = document.getElementById('connectionStatus');
  statusEl.textContent = '测试连接中...';
  statusEl.className = 'status testing';

  chrome.runtime.sendMessage({ action: 'testConnection' })
    .then(function(response) {
      if (response.success && response.connected) {
        statusEl.textContent = '连接成功!';
        statusEl.className = 'status success';
      } else {
        statusEl.textContent = '连接失败，请检查模型是否运行';
        statusEl.className = 'status error';
      }
    })
    .catch(function(error) {
      console.error('Test connection error:', error);
      statusEl.textContent = '测试失败：' + error.message;
      statusEl.className = 'status error';
    });
}
