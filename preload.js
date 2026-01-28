const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectOutputDirectory: () => ipcRenderer.invoke('select-output-directory'),
  compressFiles: (options) => ipcRenderer.invoke('compress-files', options),
  onCompressProgress: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('compress-progress', listener);
    return () => ipcRenderer.off('compress-progress', listener);
  }
});