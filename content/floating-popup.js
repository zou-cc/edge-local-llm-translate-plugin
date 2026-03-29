// content/floating-popup.js

class FloatingPopup {
  constructor() {
    this.element = null;
    this.currentText = null;
    this.translationText = null;
    this.config = null;
    this.isContextValid = true;
    this.createElement();
  }

  isExtensionContextValid() {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.runtime.id &&
           this.isContextValid;
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'llm-translator-popup';
    this.element.className = 'llm-translator-popup';
    this.element.style.display = 'none';
    this.element.style.cssText = `
      position: absolute;
      z-index: 2147483647;
      min-width: 280px;
      max-width: 400px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      padding: 16px;
    `;
    
    this.element.innerHTML = `
      <button class="close-btn" title="关闭" style="position: absolute; top: 8px; right: 8px; background: #f0f0f0; border: none; font-size: 18px; color: #666; cursor: pointer; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 4px; z-index: 10;">&times;</button>
      <div class="popup-header" style="display: flex; align-items: center; justify-content: space-between; padding-right: 40px; margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
        <span class="original-text" style="font-weight: 600; font-size: 16px; color: #333; flex: 1;"></span>
        <button class="speak-btn" title="朗读原文" style="background: #e8f5e9; border: none; cursor: pointer; font-size: 16px; padding: 6px 10px; border-radius: 4px; margin-left: 10px;">🔊</button>
      </div>
      <div class="phonetic" style="color: #666; font-family: serif; margin: 5px 0; font-size: 14px;"></div>
      <div class="translation-content">
        <div class="loading" style="color: #999; text-align: center; padding: 16px;">翻译中...</div>
        <div class="translation-result" style="display: none;">
          <div class="meaning" style="color: #2c5282; font-size: 15px; margin: 10px 0; line-height: 1.5;"></div>
          <div class="example" style="color: #666; font-size: 13px; font-style: italic; padding: 8px; background: #f7f7f7; border-radius: 4px; border-left: 3px solid #4CAF50; margin: 10px 0; display: none;"></div>
        </div>
        <div class="error-message" style="color: #e53e3e; text-align: center; padding: 16px; display: none;"></div>
        <div class="debug-info" style="color: #999; font-size: 11px; margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px; display: none;"></div>
      </div>
      <button class="speak-translation-btn" title="朗读译文" style="display: none; background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; margin-top: 12px; width: 100%;">🔊 朗读译文</button>
    `;

    this.element.querySelector('.close-btn').addEventListener('click', () => this.hide());
    this.element.querySelector('.speak-btn').addEventListener('click', () => this.speakOriginal());
    this.element.querySelector('.speak-translation-btn').addEventListener('click', () => this.speakTranslation());

    document.body.appendChild(this.element);
  }

  async show(text, position) {
    if (!this.isExtensionContextValid()) {
      console.log('Extension context invalid, cannot show popup');
      return;
    }
    
    console.log('=== Showing popup for:', text);
    this.currentText = text;
    
    this.element.querySelector('.original-text').textContent = text;
    this.element.querySelector('.phonetic').textContent = '';
    this.element.querySelector('.phonetic').style.display = 'none';
    this.element.querySelector('.loading').style.display = 'block';
    this.element.querySelector('.translation-result').style.display = 'none';
    this.element.querySelector('.error-message').style.display = 'none';
    this.element.querySelector('.debug-info').style.display = 'none';
    this.element.querySelector('.speak-translation-btn').style.display = 'none';

    this.positionAt(position);
    this.element.style.display = 'block';

    await this.loadConfig();
    this.requestTranslation(text);
  }

  positionAt(position) {
    const popupWidth = 320;
    const popupHeight = 200;
    
    let left = position.viewportX - popupWidth / 2;
    let top = position.viewportY + 10;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 10) left = 10;
    if (left + popupWidth > viewportWidth - 10) {
      left = viewportWidth - popupWidth - 10;
    }

    if (top + popupHeight > viewportHeight) {
      top = position.viewportY - popupHeight - 10;
    }

    this.element.style.left = left + 'px';
    this.element.style.top = top + window.scrollY + 'px';
  }

  async loadConfig() {
    if (!this.isExtensionContextValid()) {
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      if (response && response.success) {
        this.config = response.data;
        console.log('Config loaded:', this.config);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  async requestTranslation(text) {
    if (!this.isExtensionContextValid()) {
      this.displayError('扩展已更新，请刷新页面');
      return;
    }
    
    console.log('=== Requesting translation ===');
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        isWord: true,
        targetLang: this.config?.targetLanguage || '中文'
      });

      console.log('Raw response:', response);
      this.element.querySelector('.loading').style.display = 'none';

      if (response && response.success) {
        console.log('Translation data:', response.data);
        this.displayResult(response.data);
      } else {
        console.error('Translation failed:', response);
        this.displayError(response?.error || '翻译失败');
      }
    } catch (error) {
      console.error('Translation request error:', error);
      this.element.querySelector('.loading').style.display = 'none';
      this.displayError('翻译请求出错: ' + error.message);
    }
  }

  displayResult(data) {
    console.log('=== Displaying result ===', data);
    
    const resultEl = this.element.querySelector('.translation-result');
    const meaningEl = this.element.querySelector('.meaning');
    const exampleEl = this.element.querySelector('.example');
    const phoneticEl = this.element.querySelector('.phonetic');
    const debugEl = this.element.querySelector('.debug-info');
    
    // 显示调试信息
    debugEl.textContent = 'Debug: ' + JSON.stringify(data).substring(0, 200);
    debugEl.style.display = 'block';
    
    // 显示音标
    if (data.phonetic) {
      phoneticEl.textContent = data.phonetic;
      phoneticEl.style.display = 'block';
    }

    // 显示释义
    let translationText = data.meaning || data.translation;
    if (!translationText || translationText.trim() === '') {
      translationText = data.raw || '无翻译结果';
      if (translationText.length > 100) {
        translationText = translationText.substring(0, 100) + '...';
      }
    }
    
    console.log('Setting meaning to:', translationText);
    meaningEl.textContent = translationText;
    this.translationText = translationText;

    // 显示例句
    if (data.example) {
      exampleEl.textContent = data.example;
      exampleEl.style.display = 'block';
    } else {
      exampleEl.style.display = 'none';
    }

    // 确保结果显示
    resultEl.style.display = 'block';
    this.element.querySelector('.speak-translation-btn').style.display = 'inline-block';
    
    console.log('Result displayed');
  }

  displayError(message) {
    console.error('Displaying error:', message);
    const errorEl = this.element.querySelector('.error-message');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  async speakOriginal() {
    console.log('Speaking original:', this.currentText);
    if (!this.currentText) return;
    
    try {
      const utterance = new SpeechSynthesisUtterance(this.currentText);
      utterance.rate = this.config?.ttsRate || 1.0;
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
    }
  }

  async speakTranslation() {
    console.log('Speaking translation:', this.translationText);
    if (!this.translationText) {
      console.log('No translation text available');
      return;
    }
    
    try {
      const utterance = new SpeechSynthesisUtterance(this.translationText);
      utterance.rate = this.config?.ttsRate || 1.0;
      utterance.lang = 'zh-CN';
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('TTS error:', error);
    }
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
