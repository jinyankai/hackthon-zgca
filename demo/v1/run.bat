@echo off
cd /d "%~dp0"

if not exist .env (
    echo [INFO] 未找到 .env 文件，正在从 .env.example 创建...
    copy .env.example .env
    echo [INFO] 请编辑 .env 填入你的 API Key，然后重新运行此脚本
    pause
    exit /b 1
)

if not exist venv (
    echo [INFO] 创建虚拟环境...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo [INFO] 安装依赖...
pip install -r requirements.txt -q

echo [INFO] 启动服务器 http://localhost:8000
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
