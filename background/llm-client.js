// background/llm-client.js
import configManager from './config-manager.js';
import { ENGINE_TYPES, PROMPT_TEMPLATES } from '../shared/constants.js';

class LLMClient {
  constructor() {
    this.timeout = 120000; // 2分钟超时
  }

  async translate(text, isWord, targetLang) {
    const engineConfig = await configManager.getEngineConfig();
    const prompt = isWord 
      ? PROMPT_TEMPLATES.word(text, targetLang)
      : PROMPT_TEMPLATES.sentence(text, targetLang);

    console.log('=== Translation Request ===');
    console.log('Text:', text);
    console.log('IsWord:', isWord);
    console.log('TargetLang:', targetLang);
    console.log('Engine:', engineConfig.engineType);
    console.log('Model:', engineConfig.modelName);

    try {
      const response = await this.callLLM(engineConfig, prompt);
      console.log('LLM Response:', response);
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

  async callLLM(config, prompt) {
    const { apiUrl, apiPath, modelName, engineType } = config;
    
    // Ollama 直接使用原生 API
    if (engineType === ENGINE_TYPES.OLLAMA) {
      return await this.callOllamaNative(apiUrl, modelName, prompt);
    }
    
    // 其他引擎使用 OpenAI 兼容格式
    let url = `${apiUrl}${apiPath}`;
    let body = this.buildOpenAIRequest(modelName, prompt);
    
    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseOpenAIResponse(data);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请检查本地模型服务是否运行');
      }
      throw error;
    }
  }

  buildOpenAIRequest(modelName, prompt) {
    return {
      model: modelName,
      messages: [
        { role: 'system', content: '你是一个专业的翻译助手，提供准确的翻译和音标。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1024
    };
  }

  parseOpenAIResponse(data) {
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    throw new Error('Invalid response format');
  }

  async callOllamaNative(apiUrl, modelName, prompt) {
    console.log('=== Calling Ollama ===');
    console.log('URL:', `${apiUrl}/api/generate`);
    console.log('Model:', modelName);
    console.log('Prompt:', prompt);
    
    const url = `${apiUrl}/api/generate`;
    
    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`模型 ${modelName} 不存在，请运行: ollama pull ${modelName}`);
        }
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Ollama raw response:', data);
      console.log('Response text:', data.response);
      
      if (!data.response || data.response.trim() === '') {
        console.error('Empty response from Ollama');
        throw new Error('模型返回空内容，请检查模型是否正常运行');
      }
      
      return data.response;
    } catch (error) {
      console.error('Ollama call failed:', error);
      throw error;
    }
  }

  fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout after', this.timeout, 'ms');
      controller.abort();
    }, this.timeout);
    
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timeoutId));
  }

  async testConnection() {
    try {
      const engineConfig = await configManager.getEngineConfig();
      const { apiUrl, engineType, modelName } = engineConfig;
      
      console.log('Testing connection to:', apiUrl);
      
      if (engineType === ENGINE_TYPES.OLLAMA) {
        try {
          const response = await fetch(`${apiUrl}/api/tags`, { method: 'GET' });
          if (response.ok) {
            const data = await response.json();
            console.log('Available models:', data.models ? data.models.map(m => m.name) : 'none');
            const hasModel = data.models && data.models.some(m => m.name === modelName);
            if (!hasModel) {
              console.warn(`Model ${modelName} not found in available models`);
            }
            return response.ok;
          }
          return false;
        } catch (e) {
          console.error('Connection test failed:', e);
          return false;
        }
      } else {
        const response = await fetch(`${apiUrl}/v1/models`, { method: 'GET' });
        return response.ok;
      }
    } catch (error) {
      console.error('Test connection error:', error);
      return false;
    }
  }
}

export default new LLMClient();
