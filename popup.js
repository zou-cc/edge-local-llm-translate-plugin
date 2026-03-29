// 加载配置
chrome.runtime.sendMessage({action: 'getConfig'}).then(function(r) {
  if (r.success && r.data) {
    document.getElementById('apiUrl').value = r.data.apiUrl || 'http://localhost:11434';
    document.getElementById('modelName').value = r.data.modelName || 'qwen3.5:35b';
  }
}).catch(console.error);

// 测试连接
document.getElementById('testBtn').addEventListener('click', function() {
  var statusEl = document.getElementById('connectionStatus');
  statusEl.textContent = '测试中...';
  
  chrome.runtime.sendMessage({action: 'testConnection'}).then(function(response) {
    if (response.success && response.connected) {
      statusEl.textContent = '✓ 连接成功';
      statusEl.className = 'status success';
    } else {
      statusEl.textContent = '✗ 连接失败';
      statusEl.className = 'status error';
    }
  }).catch(function(error) {
    statusEl.textContent = '错误: ' + error.message;
    statusEl.className = 'status error';
  });
});

// 保存配置
document.getElementById('saveBtn').addEventListener('click', function() {
  var config = {
    engineType: 'ollama',
    apiUrl: document.getElementById('apiUrl').value.trim(),
    modelName: document.getElementById('modelName').value.trim(),
    targetLanguage: '中文',
    ttsRate: 1.0,
    sourceLanguages: ['英文'],
    autoTranslate: true,
    wordThreshold: 20
  };
  
  chrome.runtime.sendMessage({action: 'setConfig', config: config}).then(function(response) {
    var statusEl = document.getElementById('saveStatus');
    if (response.success) {
      statusEl.textContent = '保存成功!';
      statusEl.className = 'status success';
    } else {
      statusEl.textContent = '保存失败';
      statusEl.className = 'status error';
    }
    setTimeout(function() { statusEl.textContent = ''; }, 3000);
  }).catch(function(error) {
    document.getElementById('saveStatus').textContent = '错误: ' + error.message;
    document.getElementById('saveStatus').className = 'status error';
  });
});
