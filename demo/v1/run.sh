#!/usr/bin/env bash
# Start the AI Emotion Shield v1 server
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo ">>> 未找到 .env 文件，正在从 .env.example 创建..."
  cp .env.example .env
  echo ">>> 请编辑 .env 填入你的 API Key，然后重新运行此脚本"
  exit 1
fi

if [ ! -d venv ]; then
  echo ">>> 创建虚拟环境..."
  python -m venv venv
fi

source venv/Scripts/activate 2>/dev/null || source venv/bin/activate

echo ">>> 安装依赖..."
pip install -r requirements.txt -q

echo ">>> 启动服务器 http://localhost:8000"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
