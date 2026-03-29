// 在Edge控制台运行此脚本测试扩展

console.log('=== 扩展诊断测试 ===');

// 1. 检查chrome.runtime
console.log('1. chrome.runtime 可用:', typeof chrome !== 'undefined' && !!chrome.runtime);

// 2. 检查扩展ID
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('2. 扩展ID:', chrome.runtime.id);
  
  // 3. 测试发送消息
  console.log('3. 测试发送getConfig消息...');
  chrome.runtime.sendMessage({ action: 'getConfig' })
    .then(response => {
      console.log('   响应:', response);
    })
    .catch(error => {
      console.error('   错误:', error);
    });
    
  // 4. 测试testConnection
  console.log('4. 测试发送testConnection消息...');
  chrome.runtime.sendMessage({ action: 'testConnection' })
    .then(response => {
      console.log('   响应:', response);
    })
    .catch(error => {
      console.error('   错误:', error);
    });
}

console.log('=== 诊断完成 ===');
