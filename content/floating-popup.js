// content/floating-popup.js

class FloatingPopup {
  constructor() {
    this.element = null;
    this.currentText = null;
    this.translationText = null;
    this.englishText = null;
    this.isVisible = false;
    this.ttsRate = 1.0;
    this.createElement();
    this.bindGlobalListeners();
  }

  setTtsRate(rate) {
    this.ttsRate = rate || 1.0;
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'llm-translator-popup';
    this.element.style.cssText = `
      position: fixed;
      z-index: 2147483647;
      min-width: 220px;
      max-width: 320px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      padding: 10px 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: none;
    `;

    this.element.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; gap: 8px;">
        <span class="original-text" style="font-weight: 600; font-size: 16px; color: #333; flex: 1; word-break: break-all; padding-top: 2px;"></span>
        <div style="display: flex; gap: 4px; flex-shrink: 0;">
          <button class="speak-btn" style="background: #f0f0f0; border: 1px solid #ddd; font-size: 14px; cursor: pointer; padding: 4px 8px; border-radius: 4px; line-height: 1; min-width: 28px;" title="朗读英文">🔊</button>
          <button class="close-btn" style="background: #f0f0f0; border: 1px solid #ddd; font-size: 14px; cursor: pointer; padding: 4px 8px; border-radius: 4px; line-height: 1; min-width: 28px; color: #666;" title="关闭">✕</button>
        </div>
      </div>
      <div class="phonetic" style="color: #666; font-family: serif; font-size: 13px; margin-bottom: 6px;"></div>
      <div class="loading" style="color: #999; text-align: center; padding: 12px;">翻译中...</div>
      <div class="meaning" style="color: #2c5282; font-size: 14px; line-height: 1.5; display: none; white-space: pre-wrap;"></div>
      <div class="error" style="color: #e53e3e; text-align: center; padding: 12px; display: none;"></div>
    `;

    const speakBtn = this.element.querySelector('.speak-btn');
    speakBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    speakBtn.addEventListener('mouseup', (e) => e.stopPropagation());
    speakBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.speak();
    });

    const closeBtn = this.element.querySelector('.close-btn');
    closeBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    closeBtn.addEventListener('mouseup', (e) => e.stopPropagation());
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hide();
    });

    this.element.addEventListener('mousedown', (e) => e.stopPropagation());
    this.element.addEventListener('mouseup', (e) => e.stopPropagation());

    document.body.appendChild(this.element);
  }

  bindGlobalListeners() {
    document.addEventListener('mousedown', (e) => {
      if (this.isVisible && this.element && !this.element.contains(e.target)) {
        this.hide();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  async show(text, position) {
    if (this.isVisible && this.currentText === text && this.translationText) {
      this.element.style.display = 'block';
      return;
    }

    console.log('FloatingPopup.show() called for:', text);

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

    const popupWidth = 280;
    const popupHeight = 120;

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
        const raw = response.data?.meaning || response.data?.translation || '无结果';
        const parsed = this.parseResponse(raw);
        this.translationText = parsed.meaning;
        this.englishText = parsed.englishExample || text;

        if (parsed.phonetic) {
          const ph = this.element.querySelector('.phonetic');
          ph.textContent = parsed.phonetic;
          ph.style.display = 'block';
        }
        this.element.querySelector('.meaning').textContent = parsed.meaning;
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

  parseResponse(text) {
    let phonetic = '';
    let meaning = text;
    let englishExample = '';

    const phMatch = text.match(/音标[：:]\s*([^\n]+)/);
    if (phMatch) phonetic = phMatch[1].trim();

    const mnMatch = text.match(/释义[：:]\s*([^\n]+)/);
    if (mnMatch) meaning = mnMatch[1].trim();

    const exMatch = text.match(/例句[：:]\s*([^\n]+)/);
    if (exMatch) {
      const exFull = exMatch[1].trim();
      const cnIdx = exFull.search(/[一-龥]/);
      englishExample = cnIdx > 0 ? exFull.substring(0, cnIdx).trim() : exFull;
    }

    if (mnMatch || phMatch) {
      let display = meaning;
      if (englishExample) display += '\n例句: ' + englishExample;
      return { phonetic, meaning: display, englishExample };
    }

    return { phonetic, meaning: text.trim(), englishExample: '' };
  }

  speak() {
    const text = this.englishText || this.currentText;
    if (!text) {
      console.warn('No text to speak');
      this.flashButton('.speak-btn', '?');
      return;
    }

    try {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }

      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.length, voices.map(v => `${v.name}(${v.lang})`).slice(0, 5));

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = this.ttsRate;
      utterance.volume = 1.0;
      utterance.pitch = 1.0;

      const enVoice = voices.find(v => v.lang.startsWith('en'));
      if (enVoice) utterance.voice = enVoice;

      utterance.onstart = () => {
        console.log('TTS started');
        this.flashButton('.speak-btn', '🔊');
      };
      utterance.onerror = (e) => {
        console.error('TTS error:', e.error, e);
        this.flashButton('.speak-btn', '⚠');
      };
      utterance.onend = () => {
        console.log('TTS ended');
        this.flashButton('.speak-btn', '🔊');
      };

      const spoke = window.speechSynthesis.speak(utterance);
      console.log('speak() invoked, returned:', spoke);
    } catch (e) {
      console.error('TTS exception:', e);
      this.flashButton('.speak-btn', '⚠');
    }
  }

  flashButton(selector, emoji) {
    const btn = this.element.querySelector(selector);
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = emoji;
    setTimeout(() => { btn.textContent = orig; }, 1000);
  }

  hide() {
    if (!this.isVisible) return;
    console.log('hide() called');
    this.isVisible = false;
    if (this.element) {
      this.element.style.display = 'none';
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
  }

  contains(element) {
    return this.element && this.element.contains(element);
  }
}
