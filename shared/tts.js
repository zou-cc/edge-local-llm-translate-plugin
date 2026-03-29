class TTSManager {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
  }

  /**
   * 获取所有可用语音
   */
  getVoices() {
    return this.synth.getVoices();
  }

  /**
   * 获取指定语言的语音
   */
  getVoicesByLang(langCode) {
    const voices = this.getVoices();
    const langMap = {
      'en': ['en', 'en-US', 'en-GB'],
      'zh': ['zh', 'zh-CN', 'zh-TW', 'zh-HK'],
      'ja': ['ja', 'ja-JP'],
      'ko': ['ko', 'ko-KR'],
      'fr': ['fr', 'fr-FR'],
      'de': ['de', 'de-DE'],
      'es': ['es', 'es-ES'],
      'ru': ['ru', 'ru-RU']
    };
    
    const prefixes = langMap[langCode] || [langCode];
    return voices.filter(v => prefixes.some(p => v.lang.startsWith(p)));
  }

  /**
   * 朗读文本
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // 停止当前朗读
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // 设置语音
      if (options.voice) {
        utterance.voice = options.voice;
      } else if (options.lang) {
        const voices = this.getVoicesByLang(options.lang);
        if (voices.length > 0) {
          utterance.voice = voices[0];
        }
      }

      // 设置参数
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  /**
   * 停止朗读
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * 是否正在朗读
   */
  isSpeaking() {
    return this.synth ? this.synth.speaking : false;
  }
}

// 导出单例
export const ttsManager = new TTSManager();
export default ttsManager;
