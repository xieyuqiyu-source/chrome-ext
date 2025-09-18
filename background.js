// background.js - 侧边栏笔记扩展后台脚本
chrome.runtime.onInstalled.addListener(() => {
  console.log('笔记扩展已安装');
});

// 处理扩展图标点击，打开侧边栏
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // 打开侧边栏
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (error) {
    console.error('打开侧边栏失败:', error);
  }
});

// 设置侧边栏默认启用
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
