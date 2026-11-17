'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mvApi', {
  loadState: () => ipcRenderer.invoke('state:load'),
  saveState: (s) => ipcRenderer.send('state:save', s),
  setLang: (lang) => ipcRenderer.send('ui:lang', lang),
  toggleFullscreen: () => ipcRenderer.send('win:fullscreen'),
  clearSession: () => ipcRenderer.invoke('session:clear'),
  resetPermissions: () => ipcRenderer.invoke('permissions:reset'),
  showDownload: (file) => ipcRenderer.send('download:show', file),
  setPaneZoom: (wcId, zoom, width, height) => ipcRenderer.send('pane:zoom', wcId, zoom, width, height),
  onShortcut: (cb) => ipcRenderer.on('shortcut', (_e, name, wcId) => cb(name, wcId)),
  onWebviewFocus: (cb) => ipcRenderer.on('webview-focus', (_e, wcId) => cb(wcId)),
  onOpenInPane: (cb) => ipcRenderer.on('open-in-pane', (_e, url, wcId) => cb(url, wcId)),
  onDownload: (cb) => ipcRenderer.on('download', (_e, info) => cb(info)),
});
