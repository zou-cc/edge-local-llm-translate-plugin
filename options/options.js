// options/options.js
import { DEFAULT_CONFIG, ENGINE_DEFAULTS, LANGUAGES } from '../shared/constants.js';

class OptionsPage {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadConfig();
    this.bindEvents();
    this.updateEngineDefaults();
  }

  bindEvents() {
    // 引擎类型变化时更新默认API地址
    document.getElementById('engineType').addEventListener('change', () => {
      this.updateEngineDefaults();
    });

    // 语速滑块
    document.getElementById('ttsRate').addEventListener('input', (e) => {
      document.getElementById('ttsRateValue').textContent = e.target.value + 'x';
    });

    // 测试连接
    document.getElementById('testConnectionBtn').addEventListener('click', () => {
      this.testConnection();
    });

    // 测试TTS
    document.getElementById('testTtsBtn').addEventListener('click', () => {
      this.testTTS();
    });

    // 清除缓存
    document.getElementById('clearCacheBtn').addEventListener('click', () => {
      this.clearCache();
    });

    // 保存
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveConfig();
    });

    // 重置
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetConfig();
    });
  }

  updateEngineDefaults() {
    const engineType = document.getElementById('engineType').value;
    const defaults = ENGINE_DEFAULTS[engineType];
    const apiUrlInput = document.getElementById('apiUrl');
    
    // 只有用户未修改过时才自动填充
    if (!apiUrlInput.dataset.userModified) {
      apiUrlInput.value = defaults.apiUrl;
    }

    // 建议模型名称
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

  async loadConfig() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      if (response.success) {
        this.populateForm(response.data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this.populateForm(DEFAULT_CONFIG);
    }
  }

  populateForm(config) {
    document.getElementById('engineType').value = config.engineType;
    document.getElementById('apiUrl').value = config.apiUrl;
    document.getElementById('apiUrl').dataset.userModified = 'true';
    document.getElementById('modelName').value = config.modelName;
    document.getElementById('targetLanguage').value = config.targetLanguage;
    document.getElementById('ttsRate').value = config.ttsRate;
    document.getElementById('ttsRateValue').textContent = config.ttsRate + 'x';
    document.getElementById('autoTranslate').checked = config.autoTranslate;
    document.getElementById('wordThreshold').value = config.wordThreshold;

    // 设置源语言
    const sourceLangs = config.sourceLanguages || ['英文'];
    document.querySelectorAll('#sourceLanguages input').forEach(checkbox => {
      checkbox.checked = sourceLangs.includes(checkbox.value);
    });
  }

  collectFormData() {
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
      wordThreshold: parseInt(document.getElementById('wordThreshold').value),
      hotkey: DEFAULT_CONFIG.hotkey
    };
  }

  async saveConfig() {
    const config = this.collectFormData();
    
    try {
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
    }
  }

  async testConnection() {
    const statusEl = document.getElementById('connectionStatus');
    statusEl.textContent = '测试连接中...';
    statusEl.className = 'status testing';

    try {
      const response = await chrome.runtime.sendMessage({ action: 'testConnection' });
      
      if (response.success && response.connected) {
        statusEl.textContent = '连接成功!';
        statusEl.className = 'status success';
      } else {
        statusEl.textContent = '连接失败，请检查模型是否运行';
        statusEl.className = 'status error';
      }
    } catch (error) {
      statusEl.textContent = '测试失败：' + error.message;
      statusEl.className = 'status error';
    }
  }

  testTTS() {
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

  async clearCache() {
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

  resetConfig() {
    if (confirm('确定要恢复默认设置吗？')) {
      this.populateForm(DEFAULT_CONFIG);
    }
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage();
});
