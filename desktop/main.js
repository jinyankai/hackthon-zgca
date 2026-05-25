const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");
const { exec } = require("child_process");

let mainWindow = null;
let isExpanded = false;
let lastFeishuDetected = false;

function detectFeishuWindow() {
  return new Promise((resolve) => {
    const ps = `powershell -NoProfile -Command "Get-Process | Where-Object { $_.MainWindowTitle -ne '' -and ($_.ProcessName -match 'Feishu|Lark' -or $_.MainWindowTitle -match '飞书|Lark') } | Select-Object -First 1 | ForEach-Object { $_.ProcessName }"`;
    exec(ps, { timeout: 3000 }, (err, stdout) => {
      resolve(!err && stdout.trim().length > 0);
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 80,
    x: 100,
    y: 100,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWindow.setVisibleOnAllWorkspaces(true);
}

function toggleExpand() {
  if (!mainWindow) return;
  isExpanded = !isExpanded;
  if (isExpanded) {
    mainWindow.setSize(420, 320);
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("toggle-expand", true);
  } else {
    mainWindow.setSize(420, 80);
    mainWindow.webContents.send("toggle-expand", false);
  }
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register("Ctrl+Alt+Space", async () => {
    const feishuActive = await detectFeishuWindow();
    lastFeishuDetected = feishuActive;
    mainWindow.webContents.send("feishu-status", feishuActive);
    toggleExpand();
  });

  setInterval(async () => {
    const detected = await detectFeishuWindow();
    if (detected !== lastFeishuDetected) {
      lastFeishuDetected = detected;
      if (mainWindow) {
        mainWindow.webContents.send("feishu-status", detected);
      }
    }
  }, 5000);
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.handle("get-feishu-status", async () => {
  const detected = await detectFeishuWindow();
  lastFeishuDetected = detected;
  return detected;
});

ipcMain.handle("collapse-window", () => {
  if (isExpanded) {
    isExpanded = false;
    mainWindow.setSize(420, 80);
    mainWindow.webContents.send("toggle-expand", false);
  }
});
