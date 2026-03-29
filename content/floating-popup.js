// content/floating-popup.js
import { ttsManager } from '../shared/tts.js';
import { LANGUAGES } from '../shared/constants.js';

export class FloatingPopup {
  constructor() {
    this.element = null;
    this.currentText = null;
    this.isTranslating = false;
    this.config = null;
    this.createElement();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'llm-translator-popup';
    this.element.className = 'llm-translator-popup';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="popup-header">
        <span class="original-text"></span>
        <button class="speak-btn" title="朗读原文">🔊</button>
      </div>
      <div class="phonetic"></div>
      <div class="translation-content">
        <div class="loading">翻译中...</div>
        <div class="translation-result" style="display: none;">
          <div class="meaning"></div>
          <div class="example"></div>
        </div>
        <div class="error-message" style="display: none;"></div>
      </div>
      <button class="speak-translation-btn" title="朗读译文" style="display: none;">🔊 朗读译文</button>
      <button class="close-btn" title="关闭">&times;</button>
    `;

    // 绑定事件
    this.element.querySelector('.close-btn').addEventListener('click', () => this.hide());
    this.element.querySelector('.speak-btn').addEventListener('click', () => this.speakOriginal());
    this.element.querySelector('.speak-translation-btn').addEventListener('click', () => this.speakTranslation());

    document.body.appendChild(this.element);
  }

  async show(text, position) {
    this.currentText = text;
    this.isTranslating = true;

    // 显示原文
    this.element.querySelector('.original-text').textContent = text;
    this.element.querySelector('.phonetic').textContent = '';
    this.element.querySelector('.loading').style.display = 'block';
    this.element.querySelector('.translation-result').style.display = 'none';
    this.element.querySelector('.error-message').style.display = 'none';
    this.element.querySelector('.speak-translation-btn').style.display = 'none';

    // 定位
    this.positionAt(position);
    this.element.style.display = 'block';

    // 加载配置
    await this.loadConfig();

    // 请求翻译
    this.requestTranslation(text);
  }

  positionAt(position) {
    const popupWidth = 320;
    const popupHeight = 200;
    
    let left = position.viewportX - popupWidth / 2;
    let top = position.viewportY + 10;

    // 边界检查
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 10) left = 10;
    if (left + popupWidth > viewportWidth - 10) {
      left = viewportWidth - popupWidth - 10;
    }

    if (top + popupHeight > viewportHeight) {
      top = position.viewportY - popupHeight - 10;
    }

    this.element.style.left = `${left + window.scrollX}px`;
    this.element.style.top = `${top + window.scrollY}px`;
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

  async requestTranslation(text) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        isWord: true,
        targetLang: this.config?.targetLanguage || '中文'
      });

      this.element.querySelector('.loading').style.display = 'none';

      if (response.success) {
        this.displayResult(response.data);
      } else {
        this.displayError(response.error || '翻译失败');
      }
    } catch (error) {
      this.element.querySelector('.loading').style.display = 'none';
      this.displayError('翻译服务异常');
    }

    this.isTranslating = false;
  }

  displayResult(data) {
    const resultEl = this.element.querySelector('.translation-result');
    
    // 显示音标
    if (data.phonetic) {
      this.element.querySelector('.phonetic').textContent = data.phonetic;
    }

    // 显示释义
    if (data.meaning) {
      this.element.querySelector('.meaning').textContent = data.meaning;
    }

    // 显示例句
    const exampleEl = this.element.querySelector('.example');
    if (data.example) {
      exampleEl.textContent = data.example;
      exampleEl.style.display = 'block';
    } else {
      exampleEl.style.display = 'none';
    }

    resultEl.style.display = 'block';
    this.element.querySelector('.speak-translation-btn').style.display = 'inline-block';
    
    // 保存译文用于朗读
    this.translationText = data.meaning;
  }

  displayError(message) {
    const errorEl = this.element.querySelector('.error-message');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
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
      // 获取目标语言代码
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

  hide() {
    this.element.style.display = 'none';
    this.currentText = null;
    this.translationText = null;
  }

  contains(element) {
    return this.element && this.element.contains(element);
  }
}

export default FloatingPopup;
