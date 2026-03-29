// background/config-manager.js
import { DEFAULT_CONFIG, ENGINE_DEFAULTS, CACHE_CONFIG } from '../shared/constants.js';

class ConfigManager {
  constructor() {
    this.cache = new Map();
  }

  async getConfig() {
    try {
      const result = await chrome.storage.sync.get('config');
      return { ...DEFAULT_CONFIG, ...result.config };
    } catch (error) {
      console.error('Failed to get config:', error);
      return DEFAULT_CONFIG;
    }
  }

  async setConfig(config) {
    try {
      await chrome.storage.sync.set({ config });
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }

  async getEngineConfig() {
    const config = await this.getConfig();
    const defaults = ENGINE_DEFAULTS[config.engineType];
    return {
      ...defaults,
      apiUrl: config.apiUrl || defaults.apiUrl,
      modelName: config.modelName
    };
  }

  // 缓存管理
  async getCache(key) {
    try {
      const fullKey = CACHE_CONFIG.KEY_PREFIX + key;
      const result = await chrome.storage.local.get(fullKey);
      const cached = result[fullKey];
      
      if (!cached) return null;
      
      // 检查过期
      const age = Date.now() - cached.timestamp;
      const maxAge = CACHE_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      
      if (age > maxAge) {
        await chrome.storage.local.remove(fullKey);
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setCache(key, data) {
    try {
      const fullKey = CACHE_CONFIG.KEY_PREFIX + key;
      await chrome.storage.local.set({
        [fullKey]: {
          data,
          timestamp: Date.now()
        }
      });
      
      // 清理过期缓存
      await this.cleanExpiredCache();
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async cleanExpiredCache() {
    try {
      const all = await chrome.storage.local.get(null);
      const keys = Object.keys(all).filter(k => k.startsWith(CACHE_CONFIG.KEY_PREFIX));
      
      if (keys.length > CACHE_CONFIG.MAX_ENTRIES) {
        // 按时间戳排序，删除最旧的
        const sorted = keys
          .map(k => ({ key: k, timestamp: all[k].timestamp }))
          .sort((a, b) => a.timestamp - b.timestamp);
        
        const toDelete = sorted.slice(0, sorted.length - CACHE_CONFIG.MAX_ENTRIES);
        await chrome.storage.local.remove(toDelete.map(i => i.key));
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

export default new ConfigManager();
