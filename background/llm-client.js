// background/llm-client.js
import configManager from './config-manager.js';
import { ENGINE_TYPES, PROMPT_TEMPLATES } from '../shared/constants.js';

class LLMClient {
  constructor() {
    // 增加超时到 3 分钟（VSCode 可能也是这个级别）
    this.timeout = 180000;
  }

  async translate(text, isWord, targetLang) {
    console.log('=== LLM Translate ===');
    console.log('Text:', text.substring(0, 50));
    
    const engineConfig = await configManager.getEngineConfig();
    const prompt = isWord 
      ? PROMPT_TEMPLATES.word(text, targetLang)
      : PROMPT_TEMPLATES.sentence(text, targetLang);

    try {
      console.log('Calling Ollama...');
      const startTime = Date.now();
      
      const response = await this.callOllamaNative(
        engineConfig.apiUrl, 
        engineConfig.modelName, 
        prompt
      );
      
      const duration = Date.now() - startTime;
      console.log('Translation completed in', duration, 'ms');
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async callOllamaNative(apiUrl, modelName, prompt) {
    console.log('Calling Ollama API...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Timeout reached, aborting...');
      controller.abort();
    }, this.timeout);
    
    try {
      const response = await fetch(apiUrl + '/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error('Empty response');
      }
      
      console.log('Ollama response received');
      return data.response;
      
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('请求超时（3分钟），请检查模型是否繁忙');
      }
      throw error;
    }
  }

  async testConnection() {
    try {
      const engineConfig = await configManager.getEngineConfig();
      const response = await fetch(engineConfig.apiUrl + '/api/tags');
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default new LLMClient();
