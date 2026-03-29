// background/llm-client.js
import configManager from './config-manager.js';
import { ENGINE_TYPES, PROMPT_TEMPLATES } from '../shared/constants.js';

class LLMClient {
  constructor() {
    this.timeout = 120000; // 增加到 120 秒（2分钟）
  }

  async translate(text, isWord, targetLang) {
    const engineConfig = await configManager.getEngineConfig();
    const prompt = isWord 
      ? PROMPT_TEMPLATES.word(text, targetLang)
      : PROMPT_TEMPLATES.sentence(text, targetLang);

    try {
      const response = await this.callLLM(engineConfig, prompt);
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
    
    // Ollama 直接使用原生 API 避免 CORS 问题
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
    console.log('Calling Ollama with model:', modelName);
    console.log('Prompt:', prompt.substring(0, 50) + '...');
    
    const url = `${apiUrl}/api/generate`;
    
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

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`模型 ${modelName} 不存在，请运行: ollama pull ${modelName}`);
      }
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Ollama response received');
    return data.response;
  }

  fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout, aborting...');
      controller.abort();
    }, this.timeout);
    
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timeoutId));
  }

  async testConnection() {
    try {
      const engineConfig = await configManager.getEngineConfig();
      const { apiUrl, engineType, modelName } = engineConfig;
      
      // 对于Ollama，尝试使用原生API进行简单测试
      if (engineType === ENGINE_TYPES.OLLAMA) {
        try {
          // 尝试简单的模型列表查询
          const response = await fetch(`${apiUrl}/api/tags`, { method: 'GET' });
          if (response.ok) {
            const data = await response.json();
            // 检查模型是否存在
            const hasModel = data.models && data.models.some(m => m.name === modelName);
            if (!hasModel) {
              console.warn(`模型 ${modelName} 未找到，可用模型:`, data.models.map(m => m.name));
            }
            return response.ok;
          }
          return false;
        } catch (e) {
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
