# 笔记云端同步服务器

一个轻量化的笔记云端同步服务器，为Chrome扩展提供云端存储功能。

## 🚀 快速启动

### 方法一：使用启动脚本（推荐）
```bash
./start.sh
```

### 方法二：手动启动
```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

## 📡 服务器信息

- **服务地址**: 你的服务器 IP 
- **端口**: 8013 /你自己设定端口
- **数据存储**: 本地文件系统

## 🔌 API接口

### 1. 用户登录
```http
POST /api/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "登录成功",
  "token": "abc123...",
  "username": "your_username"
}
```

### 2. 笔记同步
```http
POST /api/sync
Content-Type: application/json

{
  "username": "your_username",
  "action": "upload",
  "notes": [
    {
      "id": "note1",
      "content": "笔记内容",
      "timestamp": 1640995200000
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "成功上传 1 条笔记",
  "count": 1
}
```

### 3. 健康检查
```http
GET /api/health
```

## 📁 数据存储

- **用户数据**: `data/users.json`
- **笔记数据**: `data/{username}_notes.json`

## 🔒 安全特性

- 密码使用SHA256哈希存储
- 自动用户注册（首次登录时创建账户）
- CORS跨域支持
- 请求体大小限制（10MB）

## 🛠️ 技术栈

- **Node.js** - 运行环境
- **Express** - Web框架
- **CORS** - 跨域支持
- **文件系统** - 数据存储

## 📝 使用说明

1. 启动服务器
2. 在Chrome扩展中点击"☁️ 云端"按钮
3. 输入用户名和密码
4. 点击"🔑 登录并同步"即可上传笔记到云端

## 🔧 配置说明

- 服务器默认监听所有网络接口（0.0.0.0）
- 端口号可在 `server.js` 中修改
- 数据目录可在 `DATA_DIR` 变量中配置

## 🚨 注意事项

- 这是一个轻量化的演示服务器，生产环境建议使用数据库
- 密码虽然经过哈希处理，但建议使用强密码
- 服务器重启不会丢失数据（存储在文件中）

## 📞 故障排除

### 服务器无法启动
- 检查Node.js是否正确安装
- 确认端口8013未被占用
- 查看控制台错误信息

### 扩展连接失败
- 确认服务器正在运行
- 检查网络连接
- 验证服务器地址是否正确

### 数据同步失败
- 检查用户名和密码是否正确
- 确认笔记数据格式正确
- 查看服务器日志