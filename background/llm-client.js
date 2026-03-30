// background/llm-client.js
import configManager from './config-manager.js';
import { ENGINE_TYPES, PROMPT_TEMPLATES } from '../shared/constants.js';

class LLMClient {
  constructor() {
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
      console.log('Calling LLM API...');
      const startTime = Date.now();
      
      const response = await this.callLLM(
        engineConfig.apiUrl, 
        engineConfig.modelName, 
        prompt,
        engineConfig.engineType
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

  async callLLM(apiUrl, modelName, prompt, engineType) {
    console.log('Calling LLM API, engine:', engineType);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Timeout reached, aborting...');
      controller.abort();
    }, this.timeout);
    
    try {
      let response;
      
      // 使用 OpenAI 兼容 API (vLLM, Shimmy, LMStudio, LiteLLM)
      const useOpenAI = [ENGINE_TYPES.VLLM, ENGINE_TYPES.SHIMMY, ENGINE_TYPES.LMSTUDIO, ENGINE_TYPES.LITELLM].includes(engineType);
      
      if (useOpenAI) {
        console.log('Using OpenAI compatible API');
        response = await fetch(apiUrl + '/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            stream: false
          }),
          signal: controller.signal
        });
        
        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0]?.message?.content) {
          throw new Error('Empty response');
        }
        
        console.log('OpenAI compatible response received');
        return data.choices[0].message.content;
        
      } else {
        // Ollama 原生 API
        console.log('Using Ollama native API');
        response = await fetch(apiUrl + '/api/generate', {
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

        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        const data = await response.json();
        
        if (!data.response) {
          throw new Error('Empty response');
        }
        
        console.log('Ollama response received');
        return data.response;
      }
      
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
      const engineType = engineConfig.engineType;
      
      console.log('Testing connection, engineType:', engineType, 'apiUrl:', engineConfig.apiUrl);
      
      // 使用 OpenAI 兼容端点
      const useOpenAI = [ENGINE_TYPES.VLLM, ENGINE_TYPES.SHIMMY, ENGINE_TYPES.LMSTUDIO, ENGINE_TYPES.LITELLM].includes(engineType);
      
      let url;
      if (useOpenAI) {
        url = engineConfig.apiUrl + '/v1/models';
      } else {
        url = engineConfig.apiUrl + '/api/tags';
      }
      
      console.log('Testing URL:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  }
}

export default new LLMClient();
