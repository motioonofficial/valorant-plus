import { contextBridge, ipcRenderer } from 'electron';
import type { DrillBridge } from './api';

const bridge: DrillBridge = {
  apiUrl: () => ipcRenderer.invoke('app:apiUrl'),
  getToken: () => ipcRenderer.invoke('auth:getToken'),
  login: (optIn) => ipcRenderer.invoke('auth:login', optIn),
  devLogin: () => ipcRenderer.invoke('auth:devLogin'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  onAuthChanged: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('auth:changed', listener);
    return () => ipcRenderer.removeListener('auth:changed', listener);
  },
};

contextBridge.exposeInMainWorld('drill', bridge);
