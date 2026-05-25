@echo off
chcp 65001 >nul
echo 正在关闭情绪桌宠服务...
taskkill /fi "WINDOWTITLE eq EmotionPet-Backend" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq EmotionPet-Desktop" /f >nul 2>&1
taskkill /im electron.exe /f >nul 2>&1
echo 已关闭。
timeout /t 2 /nobreak >nul
