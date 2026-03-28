# chrome-ext

一个基于 Chrome Manifest V3 的侧边栏笔记扩展，目标是提供一个轻量、直接、可本地优先使用的浏览器笔记工具，并保留继续开源演进的空间。

当前仓库同时包含两部分：

- Chrome 扩展本体
- 一个用于登录与笔记同步的轻量 Node.js 服务端示例

## 项目状态

这是一个可运行的早期版本，核心能力已经具备：

- 通过 Chrome Side Panel 打开笔记侧边栏
- 在浏览器中创建、查看、编辑、删除笔记
- 使用 `chrome.storage.sync` 保存笔记
- 自动识别笔记中的 URL 并转换为可点击链接
- 提供基础的弹窗调试能力
- 附带一个本地可启动的云端同步服务示例

目前仓库更适合作为开源开发基础版本，而不是已经完全产品化的发行版。

## 功能特性

### 1. 侧边栏笔记

- 点击扩展图标后直接打开侧边栏
- 以卡片形式展示笔记列表
- 支持新增、查看、编辑、删除
- 支持相对时间和创建时间展示
- 长文本内容通过弹窗查看

### 2. 数据存储

- 默认使用 `chrome.storage.sync`
- 适合保存轻量级跨设备同步数据
- 不依赖第三方数据库即可完成基础使用

### 3. 内容增强

- 自动识别 `http://`、`https://`、`www.` 形式的链接
- 笔记详情中可直接点击跳转
- 保留换行展示

### 4. 配套服务端示例

`server/` 下提供一个简单的 Express 服务，用于演示：

- 用户登录 / 自动注册
- 上传笔记到服务端
- 从服务端下载笔记
- 健康检查接口

这个服务端目前更偏演示用途，适合作为后续重构的起点。

## 技术栈

- Chrome Extension Manifest V3
- 原生 HTML / CSS / JavaScript
- Chrome Side Panel API
- Chrome Storage API
- Node.js
- Express

## 目录结构

```text
chrome-ext/
├── manifest.json          # 扩展清单
├── background.js          # 后台 service worker
├── sidepanel.html         # 侧边栏页面
├── sidepanel.js           # 侧边栏交互逻辑
├── popup.html             # 扩展弹窗页面
├── popup.js               # 弹窗脚本
├── content.js             # 预留内容脚本
├── injected.js            # 预留注入脚本
├── install.html           # 安装说明页
├── icons/                 # 扩展图标资源
└── server/                # 轻量同步服务示例
    ├── package.json
    ├── server.js
    └── start.sh
```

## 本地运行

### 运行扩展

1. 打开 Chrome，进入 `chrome://extensions/`
2. 打开右上角“开发者模式”
3. 点击“加载已解压的扩展程序”
4. 选择当前仓库目录 `chrome-ext`
5. 点击扩展图标，侧边栏会自动打开

### 运行服务端

进入服务端目录后安装依赖并启动：

```bash
cd server
npm install
npm start
```

默认端口是 `8013`。

健康检查接口：

```bash
curl http://localhost:8013/api/health
```

## 服务端接口

### `POST /api/login`

用户登录接口。若用户不存在，会自动注册。

请求示例：

```json
{
  "username": "demo",
  "password": "123456"
}
```

### `POST /api/sync`

同步笔记数据。

- `action=upload` 上传笔记
- `action=download` 下载笔记

上传请求示例：

```json
{
  "username": "demo",
  "action": "upload",
  "notes": [
    {
      "id": "note_1",
      "content": "hello world",
      "timestamp": 1710000000000
    }
  ]
}
```

### `POST /api/download`

根据用户名和密码读取用户笔记。

### `GET /api/health`

服务健康检查。

## 开发说明

当前代码以原生 JavaScript 为主，结构简单，便于快速迭代。建议按下面方向继续整理：

- 明确区分“正式功能”和“调试/演示功能”
- 补齐 `content.js`、`injected.js` 等预留文件的真实用途
- 为服务端增加鉴权、数据校验和持久化方案
- 增加构建脚本、代码格式化和自动化测试
- 完善版本发布流程和变更记录

## 已知限制

- 仓库中仍有一些占位文件，例如空的 `DEVELOPMENT.md`、`TROUBLESHOOT.md`
- 服务端当前使用文件存储，不适合生产环境
- 登录和同步逻辑比较基础，安全性有限
- 项目还没有完整的测试体系
- 仓库还没有统一的开源治理文件，例如贡献指南、变更日志等

## 适合的下一步

如果你准备把它作为开源项目持续开发，比较合理的顺序是：

1. 先整理权限、功能边界和产品定位
2. 再补齐文档、License、贡献指南
3. 然后拆分前端扩展逻辑与服务端逻辑
4. 最后再做发布、商店上架或远程同步能力增强

## License

当前 `server/package.json` 中声明为 MIT，但仓库根目录还没有正式的 `LICENSE` 文件。若准备公开发布，建议补齐根目录许可证文件，并统一仓库整体授权方式。
