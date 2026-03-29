// 调试版本的options.js
console.log('=== 选项页面脚本开始加载 ===');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM已加载');
  
  // 测试按钮点击
  const testBtn = document.getElementById('testConnectionBtn');
  if (testBtn) {
    console.log('找到测试按钮');
    testBtn.addEventListener('click', async () => {
      console.log('测试按钮被点击');
      const statusEl = document.getElementById('connectionStatus');
      statusEl.textContent = '测试中...';
      
      try {
        // 直接测试Ollama API
        console.log('直接测试Ollama API...');
        const response = await fetch('http://localhost:11434/api/tags');
        console.log('Ollama响应:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Ollama模型列表:', data);
          statusEl.textContent = 'Ollama连接成功!';
          statusEl.style.color = 'green';
        } else {
          statusEl.textContent = 'Ollama返回错误: ' + response.status;
          statusEl.style.color = 'red';
        }
      } catch (error) {
        console.error('直接测试失败:', error);
        statusEl.textContent = '连接失败: ' + error.message;
        statusEl.style.color = 'red';
      }
    });
  } else {
    console.error('未找到测试按钮');
  }
  
  // 同时测试chrome.runtime消息
  const testRuntimeBtn = document.createElement('button');
  testRuntimeBtn.textContent = '测试后台消息';
  testRuntimeBtn.className = 'btn btn-secondary';
  testRuntimeBtn.style.marginTop = '10px';
  testRuntimeBtn.addEventListener('click', async () => {
    console.log('测试后台消息按钮被点击');
    const statusEl = document.getElementById('connectionStatus');
    statusEl.textContent = '测试后台通信...';
    
    try {
      console.log('发送getConfig消息...');
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      console.log('收到响应:', response);
      statusEl.textContent = '后台通信正常: ' + JSON.stringify(response).substring(0, 50);
      statusEl.style.color = 'green';
    } catch (error) {
      console.error('后台通信失败:', error);
      statusEl.textContent = '后台通信失败: ' + error.message;
      statusEl.style.color = 'red';
    }
  });
  
  testBtn.parentNode.appendChild(testRuntimeBtn);
});

console.log('=== 选项页面脚本加载完成 ===');
