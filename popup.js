// popup.js - 扩展弹窗的脚本
document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');
  
  // 显示状态消息
  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${isError ? 'error' : 'success'}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
  
  // 显示结果
  function showResult(result) {
    resultDiv.textContent = result;
  }
  
  // 获取当前活动标签页
  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }
  
  // 获取当前URL
  document.getElementById('getCurrentUrl').addEventListener('click', async () => {
    try {
      const tab = await getCurrentTab();
      showResult(`当前URL: ${tab.url}`);
      showStatus('URL获取成功');
    } catch (error) {
      showStatus('获取URL失败: ' + error.message, true);
    }
  });
  
  // 高亮所有链接
  document.getElementById('highlightLinks').addEventListener('click', async () => {
    try {
      const tab = await getCurrentTab();
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const links = document.querySelectorAll('a');
          links.forEach(link => {
            link.style.backgroundColor = '#ffff00';
            link.style.border = '2px solid #ff0000';
          });
        }
      });
      showStatus('链接高亮成功');
    } catch (error) {
      showStatus('高亮失败: ' + error.message, true);
    }
  });
  
  // 取消高亮
  document.getElementById('removeHighlight').addEventListener('click', async () => {
    try {
      const tab = await getCurrentTab();
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          const links = document.querySelectorAll('a');
          links.forEach(link => {
            link.style.backgroundColor = '';
            link.style.border = '';
          });
        }
      });
      showStatus('高亮已取消');
    } catch (error) {
      showStatus('取消高亮失败: ' + error.message, true);
    }
  });
  
  // 保存数据到storage
  document.getElementById('saveData').addEventListener('click', async () => {
    try {
      const input = document.getElementById('storageInput');
      const data = input.value.trim();
      if (!data) {
        showStatus('请输入要保存的数据', true);
        return;
      }
      
      await chrome.storage.sync.set({ 
        'userData': data,
        'timestamp': new Date().toLocaleString()
      });
      showStatus('数据保存成功');
      input.value = '';
    } catch (error) {
      showStatus('保存失败: ' + error.message, true);
    }
  });
  
  // 从storage加载数据
  document.getElementById('loadData').addEventListener('click', async () => {
    try {
      const result = await chrome.storage.sync.get(['userData', 'timestamp']);
      if (result.userData) {
        showResult(`保存的数据: ${result.userData}\n保存时间: ${result.timestamp}`);
        showStatus('数据加载成功');
      } else {
        showResult('没有找到保存的数据');
        showStatus('没有数据');
      }
    } catch (error) {
      showStatus('加载失败: ' + error.message, true);
    }
  });
  
  // 注入自定义脚本
  document.getElementById('injectScript').addEventListener('click', async () => {
    try {
      const tab = await getCurrentTab();
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['injected.js']
      });
      showStatus('脚本注入成功');
    } catch (error) {
      showStatus('注入失败: ' + error.message, true);
    }
  });
  
  // 显示提示
  document.getElementById('showAlert').addEventListener('click', async () => {
    try {
      const tab = await getCurrentTab();
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          alert('这是来自Chrome扩展的消息！');
        }
      });
      showStatus('提示已显示');
    } catch (error) {
      showStatus('显示提示失败: ' + error.message, true);
    }
  });
});
