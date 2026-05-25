@echo off
chcp 65001 >nul
echo ============================================
echo   情绪桌宠 - 一键启动
echo   骂得痛快，发得得体
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python 未安装，请先安装 Python 3.10+
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js 未安装，请先安装 Node.js 18+
    pause
    exit /b 1
)

:: Start backend
echo [1/2] 启动后端服务 (port 8000)...
cd /d "%~dp0backend"
start "EmotionPet-Backend" cmd /c "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul

:: Start desktop pet
echo [2/2] 启动桌面宠物...
cd /d "%~dp0desktop"
start "EmotionPet-Desktop" cmd /c "npx electron ."

echo.
echo ============================================
echo   已启动！
echo   - 后端: http://localhost:8000
echo   - 桌宠: Ctrl+Alt+Space 唤起输入框
echo   - 模式: dry_run (不实际发送到飞书)
echo ============================================
echo.
echo 按任意键关闭此窗口（服务会继续在后台运行）
pause >nul
