// sidepanel/sidepanel.js
import { ttsManager } from '../shared/tts.js';
import { LANGUAGES } from '../shared/constants.js';

class SidePanel {
  constructor() {
    this.currentText = null;
    this.translationText = null;
    this.config = null;
    this.init();
  }

  init() {
    this.loadConfig();
    this.bindEvents();
    this.checkForPendingTranslation();

    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
  }

  bindEvents() {
    document.getElementById('closeBtn').addEventListener('click', () => this.close());
    document.getElementById('speakOriginalBtn').addEventListener('click', () => this.speakOriginal());
    document.getElementById('speakTranslationBtn').addEventListener('click', () => this.speakTranslation());
    document.getElementById('copyBtn').addEventListener('click', () => this.copyTranslation());
    document.getElementById('retryBtn').addEventListener('click', () => this.retry());
    document.getElementById('errorRetryBtn').addEventListener('click', () => this.retry());
  }

  async loadConfig() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      if (response.success) {
        this.config = response.data;
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  async checkForPendingTranslation() {
    try {
      const result = await chrome.storage.local.get('pendingTranslation');
      if (result.pendingTranslation) {
        this.translate(result.pendingTranslation);
        await chrome.storage.local.remove('pendingTranslation');
      }
    } catch (error) {
      console.error('Failed to check pending translation:', error);
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'translateInSidePanel':
        this.translate(request.text);
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ success: false });
    }
  }

  translate(text) {
    this.currentText = text;
    this.translationText = null;

    // 显示加载状态
    this.showLoading();

    // 请求翻译
    this.requestTranslation(text);
  }

  async requestTranslation(text) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        isWord: false,
        targetLang: this.config?.targetLanguage || '中文'
      });

      if (response.success) {
        this.showResult(text, response.data.translation || response.data);
      } else {
        this.showError(response.error || '翻译失败');
      }
    } catch (error) {
      this.showError('翻译服务异常，请检查本地模型是否运行');
    }
  }

  showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('empty').style.display = 'none';
  }

  showResult(original, translation) {
    this.translationText = translation;

    document.getElementById('originalText').textContent = original;
    document.getElementById('translationText').textContent = translation;

    document.getElementById('loading').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('empty').style.display = 'none';
  }

  showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('empty').style.display = 'none';
  }

  async speakOriginal() {
    if (!this.currentText) return;
    
    try {
      await ttsManager.speak(this.currentText, {
        rate: this.config?.ttsRate || 1.0
      });
    } catch (error) {
      console.error('TTS error:', error);
    }
  }

  async speakTranslation() {
    if (!this.translationText) return;
    
    try {
      const langCode = this.getLangCode(this.config?.targetLanguage);
      await ttsManager.speak(this.translationText, {
        lang: langCode,
        rate: this.config?.ttsRate || 1.0
      });
    } catch (error) {
      console.error('TTS error:', error);
    }
  }

  getLangCode(langName) {
    const lang = LANGUAGES.find(l => l.name === langName);
    return lang ? lang.code : 'zh';
  }

  async copyTranslation() {
    if (!this.translationText) return;
    
    try {
      await navigator.clipboard.writeText(this.translationText);
      const btn = document.getElementById('copyBtn');
      const originalText = btn.textContent;
      btn.textContent = '已复制!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }

  retry() {
    if (this.currentText) {
      this.translate(this.currentText);
    }
  }

  close() {
    window.close();
  }
}

// 初始化
new SidePanel();
