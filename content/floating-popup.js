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
    this.element.innerHTML = `
      <div class="popup-header">
        <span class="original-text"></span>
        <button class="speak-btn" title="朗读原文">🔊</button>
      </div>
      <div class="phonetic" style="color: #666; font-family: serif; margin: 5px 0;"></div>
      <div class="translation-content">
        <div class="loading">翻译中...</div>
        <div class="translation-result" style="display: none;">
          <div class="meaning" style="color: #2c5282; font-size: 15px; margin: 10px 0;"></div>
          <div class="example" style="color: #666; font-size: 13px; font-style: italic; padding: 8px; background: #f7f7f7; border-radius: 4px; border-left: 3px solid #4CAF50; margin: 10px 0;"></div>
        </div>
        <div class="error-message" style="color: #e53e3e; text-align: center; padding: 16px;"></div>
      </div>
      <button class="speak-translation-btn" title="朗读译文" style="display: none; background: #4CAF50; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; margin-top: 8px;">🔊 朗读译文</button>
      <button class="close-btn" title="关闭" style="position: absolute; top: 8px; right: 8px; background: none; border: none; font-size: 20px; color: #999; cursor: pointer; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px;">&times;</button>
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
    
    this.currentText = text;
    
    this.element.querySelector('.original-text').textContent = text;
    this.element.querySelector('.phonetic').textContent = '';
    this.element.querySelector('.loading').style.display = 'block';
    this.element.querySelector('.translation-result').style.display = 'none';
    this.element.querySelector('.error-message').style.display = 'none';
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
    this.element.style.top = top + 'px';
  }

  async loadConfig() {
    if (!this.isExtensionContextValid()) {
      return;
    }
    
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      if (response && response.success) {
        this.config = response.data;
      }
    } catch (error) {
      if (error.message && error.message.includes('Extension context invalidated')) {
        console.log('Extension context invalidated in popup');
        this.isContextValid = false;
      } else {
        console.error('Failed to load config:', error);
      }
    }
  }

  async requestTranslation(text) {
    if (!this.isExtensionContextValid()) {
      this.element.querySelector('.loading').style.display = 'none';
      this.displayError('扩展已更新，请刷新页面');
      return;
    }
    
    try {
      console.log('Requesting translation for:', text);
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        isWord: true,
        targetLang: this.config?.targetLanguage || '中文'
      });

      console.log('Translation response:', response);
      this.element.querySelector('.loading').style.display = 'none';

      if (response && response.success) {
        this.displayResult(response.data);
      } else {
        this.displayError(response?.error || '翻译失败');
      }
    } catch (error) {
      console.error('Translation error:', error);
      this.element.querySelector('.loading').style.display = 'none';
      if (error.message && error.message.includes('Extension context invalidated')) {
        this.isContextValid = false;
        this.displayError('扩展已更新，请刷新页面');
      } else {
        this.displayError('翻译服务异常: ' + error.message);
      }
    }
  }

  displayResult(data) {
    console.log('Displaying result:', data);
    
    const resultEl = this.element.querySelector('.translation-result');
    const meaningEl = this.element.querySelector('.meaning');
    const exampleEl = this.element.querySelector('.example');
    const phoneticEl = this.element.querySelector('.phonetic');
    
    // 显示音标
    if (data.phonetic) {
      phoneticEl.textContent = data.phonetic;
      phoneticEl.style.display = 'block';
    } else {
      phoneticEl.style.display = 'none';
    }

    // 显示释义（优先使用 meaning，否则使用 translation）
    const translationText = data.meaning || data.translation || '无翻译结果';
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
    
    console.log('Result displayed successfully');
  }

  displayError(message) {
    console.error('Displaying error:', message);
    const errorEl = this.element.querySelector('.error-message');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  async speakOriginal() {
    console.log('Speaking original:', this.currentText);
    if (!this.currentText) {
      console.log('No original text available');
      return;
    }
    try {
      const utterance = new SpeechSynthesisUtterance(this.currentText);
      utterance.rate = this.config?.ttsRate || 1.0;
      // 设置语言为英文
      utterance.lang = 'en-US';
      utterance.onstart = () => console.log('TTS started');
      utterance.onend = () => console.log('TTS ended');
      utterance.onerror = (e) => console.error('TTS error:', e);
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
      // 设置语言为中文
      utterance.lang = 'zh-CN';
      utterance.onstart = () => console.log('TTS started');
      utterance.onend = () => console.log('TTS ended');
      utterance.onerror = (e) => console.error('TTS error:', e);
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
