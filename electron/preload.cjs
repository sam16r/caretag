// Preload script for Electron
// This script runs before the renderer process is loaded
// It has access to Node.js APIs and can expose safe APIs to the renderer

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// specific Electron features without exposing the entire API
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform information
  platform: process.platform,
  
  // App version
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // Window controls (optional - for custom title bar)
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
});

// Log that we're running in Electron
console.log('CareTag Desktop App initialized');
