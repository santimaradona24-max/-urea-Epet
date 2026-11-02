'use strict';
const { app, BrowserWindow, shell, dialog } = require('electron');

const HOME = 'https://aurea-epet6.vercel.app/';
const ORIGIN = new URL(HOME).origin;
function internal(url) {
  try { return new URL(url).origin === ORIGIN && new URL(url).protocol === 'https:'; }
  catch (_) { return false; }
}
function external(url) {
  try { const p = new URL(url).protocol; return p === 'https:' || p === 'mailto:'; }
  catch (_) { return false; }
}
function createWindow() {
  const win = new BrowserWindow({
    title: 'Áurea | EPET N.º 6',
    width: 1280, height: 820, minWidth: 800, minHeight: 560,
    show: true, autoHideMenuBar: true, backgroundColor: '#f9f5ec',
    webPreferences: { sandbox: true, nodeIntegration: false,
      contextIsolation: true, webSecurity: true, spellcheck: true }
  });
  win.webContents.setWindowOpenHandler(({url}) => {
    if (internal(url)) win.loadURL(url).catch(() => {});
    else if (external(url)) shell.openExternal(url).catch(() => {});
    return {action: 'deny'};
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!internal(url)) {
      event.preventDefault();
      if (external(url)) shell.openExternal(url).catch(() => {});
    }
  });
  win.webContents.on('did-fail-load', (_event, code, description, url, mainFrame) => {
    if (!mainFrame || code === -3 || !internal(url) || win.isDestroyed()) return;
    dialog.showMessageBox(win, {
      type: 'warning', title: 'Áurea sin conexión',
      message: 'No se pudo cargar Áurea.',
      detail: String(description || 'Verificá la conexión a Internet.'),
      buttons: ['Reintentar', 'Cerrar'], defaultId: 0, cancelId: 1
    }).then(({response}) => {
      if (win.isDestroyed()) return;
      if (response === 0) win.loadURL(HOME).catch(() => {});
      else win.close();
    });
  });
  win.loadURL(HOME).catch(() => {});
}
app.setAppUserModelId('ar.edu.epet6.aurea');
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (!BrowserWindow.getAllWindows().length) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
