import { join, resolve } from 'node:path';
import { BrowserWindow, app, ipcMain, shell } from 'electron';
import { clearToken, loadToken, saveToken } from './tokenStore';

const API_URL = process.env.DRILL_API_URL ?? 'http://localhost:4000';
const PROTOCOL = 'drill';
const MIN_SPLASH_MS = 1500;

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;

// drill:// links from the browser (RSO callback) must reach this running instance.
if (process.defaultApp && process.argv[1]) {
  app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const url = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`));
    if (url) void handleProtocolUrl(url);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
  app.on('open-url', (event, url) => {
    event.preventDefault();
    void handleProtocolUrl(url);
  });
  app.whenReady().then(start);
}

function loadPage(win: BrowserWindow, page: 'index' | 'splash') {
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  if (devUrl) void win.loadURL(`${devUrl}/${page}.html`);
  else void win.loadFile(join(__dirname, `../renderer/${page}.html`));
}

function start() {
  const shownAt = Date.now();

  splashWindow = new BrowserWindow({
    width: 960,
    height: 560,
    frame: false,
    resizable: false,
    backgroundColor: '#0F1923',
    show: true,
  });
  loadPage(splashWindow, 'splash');

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: '#0F1923',
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false,
    },
  });
  loadPage(mainWindow, 'index');

  mainWindow.once('ready-to-show', () => {
    const wait = Math.max(MIN_SPLASH_MS - (Date.now() - shownAt), 0);
    setTimeout(() => {
      splashWindow?.close();
      splashWindow = null;
      mainWindow?.show();
    }, wait);
  });

  // Open external links in the user's browser, never inside the app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function handleProtocolUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.host !== 'auth') return;
  const code = url.searchParams.get('code');
  if (!code) return;

  const res = await fetch(`${API_URL}/auth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) return;
  const { token } = (await res.json()) as { token: string };
  saveToken(token);
  mainWindow?.webContents.send('auth:changed', true);
}

ipcMain.handle('auth:getToken', () => loadToken());

ipcMain.handle('auth:login', (_event, optIn: boolean) => {
  void shell.openExternal(`${API_URL}/auth/rso/login?optIn=${optIn ? '1' : '0'}`);
});

ipcMain.handle('auth:devLogin', async () => {
  const res = await fetch(`${API_URL}/auth/dev-login`, { method: 'POST' });
  if (!res.ok) throw new Error(`dev login failed: ${res.status}`);
  const { token } = (await res.json()) as { token: string };
  saveToken(token);
  return true;
});

ipcMain.handle('auth:logout', async () => {
  const token = loadToken();
  if (token) {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
  }
  clearToken();
});

ipcMain.handle('app:apiUrl', () => API_URL);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
