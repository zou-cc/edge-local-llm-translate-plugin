// content/floating-popup.js

class FloatingPopup {
  constructor() {
    this.element = null;
    this.currentText = null;
    this.translationText = null;
    this.isVisible = false;
    this.createElement();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'llm-translator-popup';
    this.element.style.cssText = `
      position: fixed;
      z-index: 2147483647;
      min-width: 200px;
      max-width: 280px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      padding: 10px 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
    `;
    
    this.element.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span class="original-text" style="font-weight: 600; font-size: 16px; color: #333;"></span>
        <button class="speak-btn" style="background: none; border: none; font-size: 16px; cursor: pointer; padding: 2px 6px;" title="朗读">🔊</button>
      </div>
      <div class="phonetic" style="color: #666; font-family: serif; font-size: 13px; margin-bottom: 6px;"></div>
      <div class="loading" style="color: #999; text-align: center; padding: 12px;">翻译中...</div>
      <div class="meaning" style="color: #2c5282; font-size: 14px; line-height: 1.5; display: none;"></div>
      <div class="error" style="color: #e53e3e; text-align: center; padding: 12px; display: none;"></div>
    `;

    // 朗读按钮
    const speakBtn = this.element.querySelector('.speak-btn');
    speakBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.speak();
    });

    document.body.appendChild(this.element);
  }

  async show(text, position) {
    if (this.isVisible && this.currentText === text && this.translationText) {
      return;
    }
    
    console.log('FloatingPopup.show() called');
    
    if (!this.element) {
      this.createElement();
    }
    
    this.isVisible = true;
    this.currentText = text;
    this.element.querySelector('.original-text').textContent = text;
    this.element.querySelector('.phonetic').textContent = '';
    this.element.querySelector('.phonetic').style.display = 'none';
    this.element.querySelector('.loading').style.display = 'block';
    this.element.querySelector('.meaning').style.display = 'none';
    this.element.querySelector('.error').style.display = 'none';

    // 定位 - 在选区下方
    const popupWidth = 250;
    const popupHeight = 100;
    
    let left = (position?.viewportX || window.innerWidth / 2) - popupWidth / 2;
    let top = (position?.viewportY || 100) + 10;
    
    if (left < 10) left = 10;
    if (left + popupWidth > window.innerWidth) left = window.innerWidth - popupWidth - 10;
    if (top + popupHeight > window.innerHeight) {
      top = (position?.viewportY || 100) - popupHeight - 10;
    }
    if (top < 10) top = 10;
    
    this.element.style.left = left + 'px';
    this.element.style.top = top + 'px';
    this.element.style.display = 'block';

    // 请求翻译
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        isWord: true,
        targetLang: '中文'
      });

      if (!this.isVisible) return;

      this.element.querySelector('.loading').style.display = 'none';

      if (response && response.success) {
        const translation = response.data?.meaning || response.data?.translation || '无结果';
        this.translationText = translation;
        
        this.element.querySelector('.meaning').textContent = translation;
        this.element.querySelector('.meaning').style.display = 'block';
      } else {
        this.element.querySelector('.error').textContent = response?.error || '翻译失败';
        this.element.querySelector('.error').style.display = 'block';
      }
    } catch (error) {
      console.error('Translation error:', error);
      if (!this.isVisible) return;
      this.element.querySelector('.loading').style.display = 'none';
      this.element.querySelector('.error').textContent = '翻译出错';
      this.element.querySelector('.error').style.display = 'block';
    }
  }

  speak() {
    console.log('speak() called');
    if (!this.translationText) {
      console.log('No translation text');
      return;
    }
    
    try {
      const utterance = new SpeechSynthesisUtterance(this.translationText);
      utterance.lang = 'zh-CN';
      utterance.rate = 1.0;
      speechSynthesis.speak(utterance);
      console.log('Speaking:', this.translationText);
    } catch (e) {
      console.error('TTS error:', e);
    }
  }

  hide() {
    console.log('hide() called');
    this.isVisible = false;
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  contains(element) {
    return this.element && this.element.contains(element);
  }
}
