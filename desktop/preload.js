const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  onToggleExpand: (cb) => ipcRenderer.on("toggle-expand", (_e, expanded) => cb(expanded)),
  onFeishuStatus: (cb) => ipcRenderer.on("feishu-status", (_e, active) => cb(active)),
  getFeishuStatus: () => ipcRenderer.invoke("get-feishu-status"),
  collapse: () => ipcRenderer.invoke("collapse-window"),
});
