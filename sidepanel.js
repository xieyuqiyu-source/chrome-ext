// sidepanel.js - 优雅的侧边栏笔记管理
document.addEventListener('DOMContentLoaded', function() {
  
  // 获取DOM元素
  const noteInput = document.getElementById('noteInput');
  const notesList = document.getElementById('notesList');
  const noteCount = document.getElementById('noteCount');
  const statusDiv = document.getElementById('status');
  const writeSection = document.getElementById('writeSection');
  const addNoteBtn = document.getElementById('addNoteBtn');
  const cancelWriteBtn = document.getElementById('cancelWrite');
  const noteModal = document.getElementById('noteModal');
  const modalText = document.getElementById('modalText');
  const modalTime = document.getElementById('modalTime');
  const closeModalBtn = document.getElementById('closeModal');
  const editModal = document.getElementById('editModal');
  const editInput = document.getElementById('editInput');
  const editModalTime = document.getElementById('editModalTime');
  const closeEditModalBtn = document.getElementById('closeEditModal');
  const editNoteBtn = document.getElementById('editNoteBtn');
  const deleteNoteBtn = document.getElementById('deleteNoteBtn');
  const saveEditBtn = document.getElementById('saveEditBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  
  let currentEditingNote = null; // 当前正在编辑的笔记
  
  // 显示状态消息
  function showStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${isError ? 'error' : 'success'} show`;
    setTimeout(() => {
      statusDiv.classList.remove('show');
    }, 3000);
  }
  
  // 生成唯一ID
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // 格式化时间
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 24小时内
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {hour: '2-digit', minute: '2-digit'});
    }
  }
  
  // URL识别和链接化功能
  function linkifyText(text) {
    // 更精确的URL正则表达式
    const urlRegex = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;
    
    return text.replace(urlRegex, function(url) {
      let href = url;
      // 如果URL不包含协议，添加https://
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        href = 'https://' + url;
      }
      
      // 创建简洁的可点击链接
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="note-link">${url}</a>`;
    });
  }
  
  // 安全地处理HTML内容 - 先处理URL链接，再转义其他内容
  function formatTextWithLinks(text) {
    // 先处理URL链接（在转义之前）
    const withLinks = linkifyText(text);
    
    // 处理换行符
    return withLinks.replace(/\n/g, '<br>');
  }
  
  // 显示写笔记界面
  function showWriteSection() {
    // 添加隐藏动画到按钮
    addNoteBtn.classList.add('hiding');
    
    // 延迟显示写作区域，确保按钮动画完成
    setTimeout(() => {
      addNoteBtn.style.display = 'none';
      writeSection.classList.add('active');
      
      // 再延迟一点聚焦输入框，确保动画流畅
      setTimeout(() => {
        noteInput.focus();
      }, 200);
    }, 150);
  }
  
  // 隐藏写笔记界面
  function hideWriteSection() {
    writeSection.classList.remove('active');
    
    setTimeout(() => {
      addNoteBtn.style.display = 'block';
      addNoteBtn.classList.remove('hiding');
      noteInput.value = '';
    }, 200);
  }
  
  // 显示笔记详情弹窗
  function showNoteModal(note) {
    currentEditingNote = note; // 保存当前查看的笔记
    // 使用 innerHTML 而不是 textContent 来支持链接
    modalText.innerHTML = formatTextWithLinks(note.content);
    modalTime.textContent = `创建时间：${new Date(note.timestamp).toLocaleString('zh-CN')}`;
    noteModal.classList.add('active');
  }
  
  // 隐藏笔记详情弹窗
  function hideNoteModal() {
    noteModal.classList.remove('active');
    currentEditingNote = null;
  }

  // 显示编辑弹窗
  function showEditModal(note) {
    // 先保存要编辑的笔记
    currentEditingNote = note;
    editInput.value = note.content;
    editModalTime.textContent = `创建时间：${new Date(note.timestamp).toLocaleString('zh-CN')}`;
    
    // 关闭查看弹窗但不清空 currentEditingNote
    noteModal.classList.remove('active');
    
    setTimeout(() => {
      editModal.classList.add('active');
      editInput.focus();
    }, 300);
  }
  
  // 隐藏编辑弹窗
  function hideEditModal() {
    editModal.classList.remove('active');
    currentEditingNote = null;
    editInput.value = '';
  }

  // 保存编辑后的笔记
  async function saveEditedNote() {
    if (!currentEditingNote) {
      showStatus('❌ 没有要编辑的笔记', true);
      return;
    }
    
    const newContent = editInput.value.trim();
    if (!newContent) {
      showStatus('请输入笔记内容', true);
      editInput.focus();
      return;
    }
    
    try {
      const result = await chrome.storage.sync.get(['notes']);
      const notes = result.notes || [];
      
      // 找到要编辑的笔记并更新
      const noteIndex = notes.findIndex(note => note.id === currentEditingNote.id);
      if (noteIndex !== -1) {
        notes[noteIndex] = {
          ...notes[noteIndex],
          content: newContent,
          preview: newContent.substring(0, 100) + (newContent.length > 100 ? '...' : ''),
          lastModified: Date.now()
        };
        
        // 保存到存储
        await chrome.storage.sync.set({ notes: notes });
        
        // 隐藏编辑弹窗
        hideEditModal();
        
        // 刷新列表
        await loadNotes();
        
        showStatus('✏️ 笔记已更新');
      } else {
        showStatus('❌ 找不到要编辑的笔记', true);
      }
      
    } catch (error) {
      showStatus('❌ 更新失败: ' + error.message, true);
    }
  }

  // 从模态框删除笔记
  async function deleteCurrentNote() {
    if (!currentEditingNote) return;
    
    if (!confirm('🗑️ 确定要删除这条笔记吗？')) {
      return;
    }
    
    try {
      const result = await chrome.storage.sync.get(['notes']);
      const notes = result.notes || [];
      
      // 过滤掉要删除的笔记
      const filteredNotes = notes.filter(note => note.id !== currentEditingNote.id);
      
      // 保存更新后的列表
      await chrome.storage.sync.set({ notes: filteredNotes });
      
      // 隐藏弹窗
      hideNoteModal();
      
      // 刷新列表
      await loadNotes();
      
      showStatus('🗑️ 笔记已删除');
      
    } catch (error) {
      showStatus('❌ 删除失败: ' + error.message, true);
    }
  }
  
  // 保存笔记
  async function saveNote() {
    const content = noteInput.value.trim();
    if (!content) {
      showStatus('请输入笔记内容', true);
      noteInput.focus();
      return;
    }
    
    try {
      // 获取现有笔记
      const result = await chrome.storage.sync.get(['notes']);
      const notes = result.notes || [];
      
      // 创建新笔记
      const newNote = {
        id: generateId(),
        content: content,
        timestamp: Date.now(),
        preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      };
      
      // 添加到开头
      notes.unshift(newNote);
      
      // 保存到存储
      await chrome.storage.sync.set({ notes: notes });
      
      // 隐藏写笔记界面
      hideWriteSection();
      
      // 刷新列表
      await loadNotes();
      
      showStatus(`✨ 笔记已保存！共 ${notes.length} 条`);
      
    } catch (error) {
      showStatus('❌ 保存失败: ' + error.message, true);
    }
  }
  
  // 加载笔记列表
  async function loadNotes() {
    try {
      const result = await chrome.storage.sync.get(['notes']);
      const notes = result.notes || [];
      
      // 更新计数
      noteCount.textContent = `${notes.length} 条笔记`;
      
      // 清空列表
      notesList.innerHTML = '';
      
      if (notes.length === 0) {
        notesList.innerHTML = `
          <div class="empty-state">
            <span class="emoji">📝</span>
            <h3>还没有笔记</h3>
            <p>点击上方按钮开始记录你的想法吧！</p>
          </div>
        `;
        return;
      }
      
      // 显示笔记卡片
      notes.forEach((note, index) => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        
        // 格式化时间显示
        const timeText = note.lastModified ? 
          `📝 ${formatTime(note.lastModified)} (已编辑)` : 
          `🕒 ${formatTime(note.timestamp)}`;
        
        noteCard.innerHTML = `
          <div class="note-preview">${formatTextWithLinks(note.preview || note.content)}</div>
          <div class="note-meta">
            <span class="note-time">${timeText}</span>
            <span class="note-actions">点击查看</span>
          </div>
        `;
        
        // 添加拖动选择支持
        let isDragging = false;
        let startX, startY;
        
        noteCard.addEventListener('mousedown', (e) => {
          isDragging = false;
          startX = e.clientX;
          startY = e.clientY;
        });
        
        noteCard.addEventListener('mousemove', (e) => {
          if (startX !== undefined && startY !== undefined) {
            const deltaX = Math.abs(e.clientX - startX);
            const deltaY = Math.abs(e.clientY - startY);
            // 如果鼠标移动超过5像素，认为是拖动
            if (deltaX > 5 || deltaY > 5) {
              isDragging = true;
            }
          }
        });
        
        // 点击查看完整内容
        noteCard.addEventListener('click', (e) => {
          // 如果是拖动操作，不触发点击
          if (isDragging) {
            return;
          }
          
          // 如果点击的是链接，不触发模态框
          if (e.target.tagName === 'A' || e.target.classList.contains('note-link')) {
            e.stopPropagation();
            return;
          }
          showNoteModal(note);
        });
        
        // 重置拖动状态
        noteCard.addEventListener('mouseup', () => {
          setTimeout(() => {
            isDragging = false;
            startX = undefined;
            startY = undefined;
          }, 10);
        });
        
        noteCard.addEventListener('mouseleave', () => {
          isDragging = false;
          startX = undefined;
          startY = undefined;
        });
        
        // 添加动画延迟
        noteCard.style.animationDelay = `${index * 0.1}s`;
        
        notesList.appendChild(noteCard);
      });
      
    } catch (error) {
      showStatus('❌ 加载失败: ' + error.message, true);
    }
  }
  
  // 删除笔记
  window.deleteNote = async function(noteId) {
    if (!confirm('🗑️ 确定要删除这条笔记吗？')) {
      return;
    }
    
    try {
      const result = await chrome.storage.sync.get(['notes']);
      const notes = result.notes || [];
      
      // 过滤掉要删除的笔记
      const filteredNotes = notes.filter(note => note.id !== noteId);
      
      // 保存更新后的列表
      await chrome.storage.sync.set({ notes: filteredNotes });
      
      // 刷新列表
      await loadNotes();
      
      showStatus('🗑️ 笔记已删除');
      
    } catch (error) {
      showStatus('❌ 删除失败: ' + error.message, true);
    }
  };
  
  // 清空所有笔记
  async function clearAllNotes() {
    if (!confirm('⚠️ 确定要删除所有笔记吗？此操作不可恢复！')) {
      return;
    }
    
    try {
      await chrome.storage.sync.set({ notes: [] });
      await loadNotes();
      showStatus('🗑️ 所有笔记已删除');
    } catch (error) {
      showStatus('❌ 清空失败: ' + error.message, true);
    }
  }
  
  // 导出笔记
  async function exportNotes() {
    try {
      const result = await chrome.storage.sync.get(['notes']);
      const notes = result.notes || [];
      
      if (notes.length === 0) {
        showStatus('❌ 没有笔记可以导出', true);
        return;
      }
      
      // 格式化笔记内容
      let exportText = `📝 我的笔记 - 导出于 ${new Date().toLocaleString('zh-CN')}\n`;
      exportText += '='.repeat(50) + '\n\n';
      
      notes.forEach((note, index) => {
        exportText += `📄 笔记 ${index + 1}\n`;
        exportText += `🕒 时间: ${new Date(note.timestamp).toLocaleString('zh-CN')}\n`;
        exportText += `📝 内容:\n${note.content}\n`;
        exportText += '-'.repeat(30) + '\n\n';
      });
      
      // 复制到剪贴板
      await navigator.clipboard.writeText(exportText);
      showStatus(`📤 已复制 ${notes.length} 条笔记到剪贴板`);
      
    } catch (error) {
      showStatus('❌ 导出失败: ' + error.message, true);
    }
  }
  
  // 绑定事件
  addNoteBtn.addEventListener('click', showWriteSection);
  cancelWriteBtn.addEventListener('click', hideWriteSection);
  document.getElementById('saveNote').addEventListener('click', saveNote);
  document.getElementById('exportNotes').addEventListener('click', exportNotes);
  document.getElementById('clearAllNotes').addEventListener('click', clearAllNotes);
  closeModalBtn.addEventListener('click', hideNoteModal);
  closeEditModalBtn.addEventListener('click', hideEditModal);
  editNoteBtn.addEventListener('click', () => {
    if (currentEditingNote) {
      showEditModal(currentEditingNote);
    }
  });
  deleteNoteBtn.addEventListener('click', deleteCurrentNote);
  cancelEditBtn.addEventListener('click', hideEditModal);

  // 保存编辑按钮 - 使用直接绑定
  document.getElementById('saveEditBtn').addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    saveEditedNote();
  });
  
  // 点击弹窗外部关闭
  noteModal.addEventListener('click', (e) => {
    if (e.target === noteModal) {
      hideNoteModal();
    }
  });

  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
      hideEditModal();
    }
  });
  
  // 键盘快捷键
  noteInput.addEventListener('keydown', (e) => {
    // Ctrl+Enter 保存
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      saveNote();
    }
    // Esc 取消
    if (e.key === 'Escape') {
      e.preventDefault();
      hideWriteSection();
    }
  });

  // 编辑框快捷键
  editInput.addEventListener('keydown', (e) => {
    // Ctrl+Enter 保存编辑
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      saveEditedNote();
    }
    // Esc 取消编辑
    if (e.key === 'Escape') {
      e.preventDefault();
      hideEditModal();
    }
  });
  
  // 全局键盘事件
  document.addEventListener('keydown', (e) => {
    // Esc 关闭弹窗
    if (e.key === 'Escape') {
      if (editModal.classList.contains('active')) {
        hideEditModal();
      } else if (noteModal.classList.contains('active')) {
        hideNoteModal();
      }
    }
    // Ctrl+N 新建笔记
    if (e.ctrlKey && e.key === 'n' && !writeSection.classList.contains('active') && !noteModal.classList.contains('active') && !editModal.classList.contains('active')) {
      e.preventDefault();
      showWriteSection();
    }
  });
  
  // 页面加载时自动加载笔记
  loadNotes();
  
  // 调试：检查关键元素
  console.log('DOM 加载完成，检查元素:');
  console.log('saveEditBtn:', saveEditBtn);
  console.log('editInput:', editInput);
  console.log('editModal:', editModal);
  
  // 确保事件绑定成功
  if (!saveEditBtn) {
    console.error('保存编辑按钮未找到！');
  }
  if (!editInput) {
    console.error('编辑输入框未找到！');
  }
  
  // 添加卡片进入动画
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .note-card {
      animation: fadeInUp 0.5s ease forwards;
    }
  `;
  document.head.appendChild(style);
  
  // 云端同步功能
  console.log('🚀 开始初始化云端同步功能...');
  
  const cloudModal = document.getElementById('cloudModal');
  const cloudSyncBtn = document.getElementById('cloudSyncBtn');
  const closeCloudModalBtn = document.getElementById('closeCloudModal');
  const cloudLoginBtn = document.getElementById('cloudLoginBtn');
  const cloudDownloadBtn = document.getElementById('cloudDownloadBtn');
  const cancelCloudBtn = document.getElementById('cancelCloudBtn');
  const cloudUsername = document.getElementById('cloudUsername');
  const cloudPassword = document.getElementById('cloudPassword');
  const cloudStatus = document.getElementById('cloudStatus');
  
  console.log('📋 DOM元素获取结果:');
  console.log('cloudModal:', cloudModal);
  console.log('cloudSyncBtn:', cloudSyncBtn);
  console.log('closeCloudModalBtn:', closeCloudModalBtn);
  console.log('cloudLoginBtn:', cloudLoginBtn);
  
  if (!cloudSyncBtn) {
    console.error('❌ 云端按钮元素未找到！请检查HTML中是否存在id="cloudSyncBtn"的元素');
    return;
  }
  
  console.log('✅ 所有云端元素获取成功，准备绑定事件监听器...');
  
  const CLOUD_SERVER = 'http://43.143.90.251:8013';
  
  // 获取本地笔记的辅助函数
  async function getNotes() {
    try {
      const result = await chrome.storage.sync.get(['notes']);
      return result.notes || [];
    } catch (error) {
      console.error('获取本地笔记失败:', error);
      return [];
    }
  }
  
  // 显示云端状态
  function showCloudStatus(message, type = 'loading') {
    cloudStatus.textContent = message;
    cloudStatus.className = `cloud-status ${type}`;
    cloudStatus.style.display = 'block';
  }
  
  // 隐藏云端状态
  function hideCloudStatus() {
    cloudStatus.style.display = 'none';
  }
  
  // 云端同步按钮点击
  cloudSyncBtn.addEventListener('click', () => {
    console.log('🔥 云端按钮被点击了！');
    console.log('cloudModal元素:', cloudModal);
    console.log('cloudSyncBtn元素:', cloudSyncBtn);
    
    cloudModal.classList.add('active');
    hideCloudStatus();
    cloudUsername.value = '';
    cloudPassword.value = '';
    cloudUsername.focus();
    
    console.log('✅ 模态框应该已经显示，添加了active类');
  });
  
  // 关闭云端模态框
  function closeCloudModal() {
    cloudModal.classList.remove('active');
    hideCloudStatus();
  }
  
  closeCloudModalBtn.addEventListener('click', closeCloudModal);
  cancelCloudBtn.addEventListener('click', closeCloudModal);
  
  // 点击模态框外部关闭
  cloudModal.addEventListener('click', (e) => {
    if (e.target === cloudModal) {
      closeCloudModal();
    }
  });
  
  // 云端登录并同步
  cloudLoginBtn.addEventListener('click', async () => {
    const username = cloudUsername.value.trim();
    const password = cloudPassword.value.trim();
    
    if (!username || !password) {
      showCloudStatus('请输入用户名和密码', 'error');
      return;
    }
    
    try {
      showCloudStatus('正在登录...', 'loading');
      
      // 登录
      const loginResponse = await fetch(`${CLOUD_SERVER}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const loginResult = await loginResponse.json();
      
      if (!loginResult.success) {
        showCloudStatus(loginResult.message, 'error');
        return;
      }
      
      showCloudStatus('登录成功，正在同步笔记...', 'loading');
      
      // 上传本地笔记到云端
      const localNotes = await getNotes();
      const syncResponse = await fetch(`${CLOUD_SERVER}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          notes: localNotes,
          action: 'upload'
        })
      });
      
      const syncResult = await syncResponse.json();
      
      if (syncResult.success) {
        showCloudStatus(`同步成功！已上传 ${syncResult.count} 条笔记`, 'success');
        showStatus(`云端同步成功！已上传 ${syncResult.count} 条笔记`);
        
        // 3秒后关闭模态框
        setTimeout(() => {
          closeCloudModal();
        }, 3000);
      } else {
        showCloudStatus(syncResult.message, 'error');
      }
      
    } catch (error) {
      console.error('云端同步失败:', error);
      showCloudStatus('网络连接失败，请检查服务器状态', 'error');
    }
  });
  
  // 下载笔记按钮点击
  cloudDownloadBtn.addEventListener('click', async () => {
    const username = cloudUsername.value.trim();
    const password = cloudPassword.value.trim();
    
    if (!username || !password) {
      showCloudStatus('请输入用户名和密码', 'error');
      return;
    }
    
    try {
      showCloudStatus('正在登录...', 'loading');
      
      // 从云端下载笔记
      const downloadResponse = await fetch(`${CLOUD_SERVER}/api/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const downloadResult = await downloadResponse.json();
      
      if (!downloadResult.success) {
        showCloudStatus(downloadResult.message, 'error');
        return;
      }
      
      showCloudStatus('正在保存到本地...', 'loading');
      
      // 保存到本地Chrome存储
      if (downloadResult.notes && downloadResult.notes.length > 0) {
        await chrome.storage.sync.set({ notes: downloadResult.notes });
        showCloudStatus(`下载成功！已恢复 ${downloadResult.count} 条笔记`, 'success');
        showStatus(`云端下载成功！已恢复 ${downloadResult.count} 条笔记`);
        
        // 刷新笔记列表
        loadNotes();
      } else {
        showCloudStatus('云端暂无笔记数据', 'success');
      }
      
      // 3秒后关闭模态框
      setTimeout(() => {
        closeCloudModal();
      }, 3000);
      
    } catch (error) {
      console.error('云端下载失败:', error);
      showCloudStatus('网络连接失败，请检查服务器状态', 'error');
    }
  });
  
  // 回车键登录
  cloudPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      cloudLoginBtn.click();
    }
  });
  
});
