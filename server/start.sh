#!/bin/bash

# 笔记云端服务器启动脚本

echo "🚀 正在启动笔记云端服务器..."
echo "📍 服务地址: http://43.143.90.251:8013"
echo "⏰ 启动时间: $(date)"
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    echo "📥 下载地址: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误: 未找到npm，请先安装npm"
    exit 1
fi

# 进入服务器目录
cd "$(dirname "$0")"

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 未找到package.json文件"
    exit 1
fi

# 安装依赖
echo "📦 正在安装依赖包..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 错误: 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"
echo ""

# 启动服务器
echo "🎯 正在启动服务器..."
echo "💡 提示: 按 Ctrl+C 停止服务器"
echo ""

node server.js