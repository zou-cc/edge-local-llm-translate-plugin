// background/llm-client.js
import configManager from './config-manager.js';
import { ENGINE_TYPES, PROMPT_TEMPLATES } from '../shared/constants.js';

class LLMClient {
  constructor() {
    this.timeout = 60000; // 1分钟
  }

  async translate(text, isWord, targetLang) {
    console.log('=== LLMClient.translate ===');
    console.log('Input text:', text);
    console.log('isWord:', isWord);
    
    const engineConfig = await configManager.getEngineConfig();
    console.log('Engine:', engineConfig.engineType);
    console.log('Model:', engineConfig.modelName);
    
    const prompt = isWord 
      ? PROMPT_TEMPLATES.word(text, targetLang)
      : PROMPT_TEMPLATES.sentence(text, targetLang);
    
    console.log('Prompt:', prompt);

    try {
      const response = await this.callOllamaNative(
        engineConfig.apiUrl, 
        engineConfig.modelName, 
        prompt
      );
      
      console.log('Ollama raw response:', response);
      
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
    console.log('=== Calling Ollama ===');
    console.log('URL:', apiUrl + '/api/generate');
    
    const url = apiUrl + '/api/generate';
    
    try {
      console.log('Sending fetch request...');
      const response = await fetch(url, {
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
        throw new Error('HTTP ' + response.status);
      }

      const data = await response.json();
      console.log('Response data:', JSON.stringify(data).substring(0, 500));
      
      if (!data.response) {
        throw new Error('Empty response from Ollama');
      }
      
      console.log('Translation text:', data.response);
      return data.response;
      
    } catch (error) {
      console.error('Ollama call error:', error);
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
