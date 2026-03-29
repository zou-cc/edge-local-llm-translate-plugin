// content/floating-popup.js - Debug version

class FloatingPopup {
  constructor() {
    console.log('FloatingPopup constructor');
    this.element = null;
    this.currentText = null;
    this.translationText = null;
    this.createElement();
  }

  createElement() {
    console.log('Creating popup element');
    this.element = document.createElement('div');
    this.element.id = 'llm-translator-popup';
    this.element.style.cssText = `
      position: absolute;
      z-index: 2147483647;
      min-width: 300px;
      max-width: 500px;
      background: white;
      border: 2px solid #4CAF50;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      padding: 15px;
      font-family: Arial, sans-serif;
    `;
    
    this.element.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px; color: #333;">原文: <span class="original-text"></span></div>
      <div class="status" style="color: #666; margin: 10px 0;">初始化...</div>
      <div class="result" style="color: #2c5282; font-size: 16px; margin: 10px 0; min-height: 30px; border: 1px dashed #ccc; padding: 10px;"></div>
      <button onclick="this.parentElement.style.display='none'" style="float: right; background: #f0f0f0; border: none; padding: 5px 10px; cursor: pointer;">关闭</button>
      <div style="clear: both;"></div>
    `;
    
    document.body.appendChild(this.element);
    console.log('Popup element created');
  }

  async show(text, position) {
    console.log('=== SHOW CALLED ===');
    console.log('Text:', text);
    
    this.currentText = text;
    const originalEl = this.element.querySelector('.original-text');
    const statusEl = this.element.querySelector('.status');
    const resultEl = this.element.querySelector('.result');
    
    originalEl.textContent = text;
    statusEl.textContent = '请求翻译中...';
    resultEl.textContent = '';
    
    this.element.style.left = (position.x + window.scrollX) + 'px';
    this.element.style.top = (position.y + window.scrollY + 20) + 'px';
    this.element.style.display = 'block';
    
    // 直接测试
    try {
      console.log('Sending message to background...');
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        isWord: true,
        targetLang: '中文'
      });
      
      console.log('Response received:', response);
      
      if (response && response.success) {
        const translation = response.data?.meaning || response.data?.translation || '无结果';
        statusEl.textContent = '翻译完成';
        resultEl.textContent = translation;
        console.log('Translation displayed:', translation);
      } else {
        statusEl.textContent = '翻译失败';
        resultEl.textContent = response?.error || '未知错误';
        console.error('Translation failed:', response);
      }
    } catch (error) {
      console.error('Error:', error);
      statusEl.textContent = '错误';
      resultEl.textContent = error.message;
    }
  }

  hide() {
    this.element.style.display = 'none';
  }

  contains(element) {
    return this.element.contains(element);
  }
}
