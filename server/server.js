const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 8013;
const DATA_DIR = path.join(__dirname, 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 简单的用户数据存储（生产环境应使用数据库）
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// 读取用户数据
function getUsers() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        }
    } catch (error) {
        console.error('读取用户数据失败:', error);
    }
    return {};
}

// 保存用户数据
function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        return true;
    } catch (error) {
        console.error('保存用户数据失败:', error);
        return false;
    }
}

// 密码哈希
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// 用户登录接口
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: '用户名和密码不能为空' 
        });
    }
    
    const users = getUsers();
    const hashedPassword = hashPassword(password);
    
    // 如果用户不存在，自动注册
    if (!users[username]) {
        users[username] = {
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        saveUsers(users);
        console.log(`新用户注册: ${username}`);
    } else if (users[username].password !== hashedPassword) {
        return res.status(401).json({ 
            success: false, 
            message: '密码错误' 
        });
    }
    
    // 生成简单的token（生产环境应使用JWT）
    const token = crypto.randomBytes(32).toString('hex');
    
    res.json({ 
        success: true, 
        message: '登录成功',
        token: token,
        username: username
    });
});

// 笔记同步接口
app.post('/api/sync', (req, res) => {
    const { username, notes, action } = req.body;
    
    if (!username) {
        return res.status(400).json({ 
            success: false, 
            message: '用户名不能为空' 
        });
    }
    
    const userNotesFile = path.join(DATA_DIR, `${username}_notes.json`);
    
    try {
        if (action === 'upload') {
            // 上传笔记到云端
            if (!notes) {
                return res.status(400).json({ 
                    success: false, 
                    message: '笔记数据不能为空' 
                });
            }
            
            const notesData = {
                notes: notes,
                lastSync: new Date().toISOString(),
                count: notes.length
            };
            
            fs.writeFileSync(userNotesFile, JSON.stringify(notesData, null, 2));
            console.log(`用户 ${username} 上传了 ${notes.length} 条笔记`);
            
            res.json({ 
                success: true, 
                message: `成功上传 ${notes.length} 条笔记`,
                count: notes.length
            });
            
        } else if (action === 'download') {
            // 从云端下载笔记
            if (fs.existsSync(userNotesFile)) {
                const notesData = JSON.parse(fs.readFileSync(userNotesFile, 'utf8'));
                console.log(`用户 ${username} 下载了 ${notesData.count} 条笔记`);
                
                res.json({ 
                    success: true, 
                    message: `成功下载 ${notesData.count} 条笔记`,
                    notes: notesData.notes,
                    lastSync: notesData.lastSync,
                    count: notesData.count
                });
            } else {
                res.json({ 
                    success: true, 
                    message: '云端暂无笔记数据',
                    notes: [],
                    count: 0
                });
            }
        } else {
            res.status(400).json({ 
                success: false, 
                message: '无效的操作类型，请使用 upload 或 download' 
            });
        }
    } catch (error) {
        console.error('笔记同步失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '服务器内部错误' 
        });
    }
});

// 下载笔记接口
app.post('/api/download', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.json({ success: false, message: '用户名和密码不能为空' });
    }
    
    const users = getUsers();
    const hashedPassword = hashPassword(password);
    
    // 验证用户
    if (!users[username] || users[username].password !== hashedPassword) {
        return res.json({ success: false, message: '用户名或密码错误' });
    }
    
    // 读取用户的笔记文件
    const userNotesFile = path.join(DATA_DIR, `${username}_notes.json`);
    
    try {
        if (fs.existsSync(userNotesFile)) {
            const data = JSON.parse(fs.readFileSync(userNotesFile, 'utf8'));
            const notes = data.notes || [];
            res.json({
                success: true,
                message: '笔记下载成功',
                notes: notes,
                count: notes.length
            });
        } else {
            res.json({
                success: true,
                message: '云端暂无笔记数据',
                notes: [],
                count: 0
            });
        }
    } catch (error) {
        console.error('读取笔记失败:', error);
        res.json({ success: false, message: '读取笔记失败' });
    }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: '服务器运行正常',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 笔记云端服务器启动成功!`);
    console.log(`📍 服务地址: http://43.143.90.251:${PORT}`);
    console.log(`📍 本地测试地址: http://localhost:${PORT}`);
    console.log(`📝 API接口:`);
    console.log(`   - POST /api/login - 用户登录`);
    console.log(`   - POST /api/sync - 笔记同步`);
    console.log(`   - POST /api/download - 笔记下载`);
    console.log(`   - GET /api/health - 健康检查`);
    console.log(`📁 数据存储目录: ${DATA_DIR}`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 服务器正在关闭...');
    process.exit(0);
});