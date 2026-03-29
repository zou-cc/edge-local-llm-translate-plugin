// content/floating-popup.js

class FloatingPopup {
  constructor() {
    this.element = null;
    this.currentText = null;
    this.translationText = null;
    this.createElement();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'llm-translator-popup';
    this.element.style.cssText = `
      position: absolute;
      z-index: 2147483647;
      min-width: 300px;
      max-width: 500px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
    `;
    
    this.element.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
        <span class="original-text" style="font-weight: 600; font-size: 16px; color: #333;"></span>
        <button class="close-btn" style="background: #f0f0f0; border: none; font-size: 18px; color: #666; cursor: pointer; width: 28px; height: 28px; border-radius: 4px;">&times;</button>
      </div>
      <div class="phonetic" style="color: #666; font-family: serif; margin: 5px 0; font-size: 14px;"></div>
      <div class="loading" style="color: #999; text-align: center; padding: 20px;">翻译中，请稍候...</div>
      <div class="result" style="display: none;">
        <div class="meaning" style="color: #2c5282; font-size: 15px; margin: 10px 0; line-height: 1.5;"></div>
        <button class="speak-btn" style="background: #4CAF50; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; margin-top: 10px;">🔊 朗读</button>
      </div>
      <div class="error" style="color: #e53e3e; text-align: center; padding: 16px; display: none;"></div>
    `;

    this.element.querySelector('.close-btn').addEventListener('click', () => this.hide());
    this.element.querySelector('.speak-btn').addEventListener('click', () => this.speak());

    document.body.appendChild(this.element);
  }

  async show(text, position) {
    console.log('Showing popup for:', text.substring(0, 50));
    
    this.currentText = text;
    this.element.querySelector('.original-text').textContent = text.substring(0, 100);
    this.element.querySelector('.phonetic').textContent = '';
    this.element.querySelector('.phonetic').style.display = 'none';
    this.element.querySelector('.loading').style.display = 'block';
    this.element.querySelector('.result').style.display = 'none';
    this.element.querySelector('.error').style.display = 'none';

    // 定位
    let left = position.x - 150;
    let top = position.y + 20;
    
    if (left < 10) left = 10;
    if (left + 300 > window.innerWidth) left = window.innerWidth - 320;
    if (top + 200 > window.innerHeight) top = position.y - 220;
    
    this.element.style.left = left + 'px';
    this.element.style.top = top + window.scrollY + 'px';
    this.element.style.display = 'block';

    // 请求翻译
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        isWord: text.length < 50 && !text.includes('\n'),
        targetLang: '中文'
      });

      this.element.querySelector('.loading').style.display = 'none';

      if (response && response.success) {
        const translation = response.data?.meaning || response.data?.translation || '无翻译结果';
        this.translationText = translation;
        
        this.element.querySelector('.meaning').textContent = translation;
        this.element.querySelector('.result').style.display = 'block';
        
        console.log('Translation displayed:', translation.substring(0, 100));
      } else {
        this.element.querySelector('.error').textContent = response?.error || '翻译失败';
        this.element.querySelector('.error').style.display = 'block';
      }
    } catch (error) {
      console.error('Translation error:', error);
      this.element.querySelector('.loading').style.display = 'none';
      this.element.querySelector('.error').textContent = '翻译出错: ' + error.message;
      this.element.querySelector('.error').style.display = 'block';
    }
  }

  speak() {
    if (!this.translationText) return;
    
    const utterance = new SpeechSynthesisUtterance(this.translationText);
    utterance.lang = 'zh-CN';
    speechSynthesis.speak(utterance);
  }

  hide() {
    this.element.style.display = 'none';
  }

  contains(element) {
    return this.element && this.element.contains(element);
  }
}
