// content/content.js - With timeout

console.log('=== CONTENT SCRIPT STARTED ===');

document.addEventListener('mouseup', async function() {
  console.log('Mouse up!');
  
  setTimeout(async function() {
    const text = window.getSelection().toString().trim();
    console.log('Selected:', text.substring(0, 50));
    
    if (text.length < 2) {
      console.log('Too short');
      return;
    }
    
    // 只翻译前100个字符（避免太长）
    const shortText = text.substring(0, 100);
    console.log('Translating:', shortText);
    
    try {
      console.log('Sending request...');
      
      // 添加超时
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout after 30s')), 30000);
      });
      
      const responsePromise = chrome.runtime.sendMessage({
        action: 'translate',
        text: shortText,
        isWord: shortText.length < 20 && !shortText.includes(' '),
        targetLang: '中文'
      });
      
      const response = await Promise.race([responsePromise, timeoutPromise]);
      
      console.log('Response:', response);
      
      if (response && response.success) {
        const translation = response.data?.meaning || response.data?.translation || '无结果';
        console.log('Success! Translation:', translation);
        alert('翻译: ' + translation);
      } else {
        console.error('Failed:', response);
        alert('失败: ' + (response?.error || '未知错误'));
      }
    } catch (e) {
      console.error('Error:', e);
      alert('错误: ' + e.message);
    }
  }, 100);
});

console.log('=== READY ===');
