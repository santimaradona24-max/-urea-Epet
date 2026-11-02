'use strict';
const { app, BrowserWindow, shell, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');

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
  if (app.isPackaged) setupNativeUpdates(win);
}

function setupNativeUpdates(win) {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.allowPrerelease = false;
  let updateReady = false;
  let checking = false;
  let updateVersion = '';
  let prompting = false;
  async function examInProgress() {
    if (win.isDestroyed() || win.webContents.isLoading()) return true;
    try {
      return await win.webContents.executeJavaScript(
        "(() => {try { const raw=sessionStorage.getItem('aurea_attempt'); if(!raw)return false; const a=JSON.parse(raw);return Boolean(a && a.status==='in_progress'); }catch(e){return true;}})()",
        true
      );
    } catch (_) { return true; }
  }
  async function offerUpdate() {
    if (!updateReady || prompting || win.isDestroyed() || await examInProgress()) return;
    prompting = true;
    try {
      const { response } = await dialog.showMessageBox(win, {
        type: 'info',
        title: 'Áurea · Actualización disponible',
        message: 'La versión ' + updateVersion + ' está lista para instalar.',
        detail: 'Se cerrará y volverá a abrir Áurea. Las evaluaciones en curso nunca se interrumpen.',
        buttons: ['Actualizar ahora', 'Más tarde'],
        defaultId: 1, cancelId: 1
      });
      if (response === 0 && !(await examInProgress())) {
        updateReady = false;
        autoUpdater.quitAndInstall(false, true);
      }
    } finally { prompting = false; }
  }
  autoUpdater.on('update-downloaded', info => {
    updateVersion = info.version || 'nueva';
    updateReady = true;
    offerUpdate().catch(() => {});
  });
  autoUpdater.on('error', error => {
    // La aplicación sigue funcionando aunque GitHub esté momentáneamente inaccesible.
    console.warn('Áurea: no se pudo consultar la actualización', error?.message || error);
  });
  function check() {
    if (checking || win.isDestroyed()) return;
    checking = true;
    autoUpdater.checkForUpdates().catch(() => {}).finally(() => { checking = false; });
  }
  win.webContents.on('did-finish-load', () => offerUpdate().catch(() => {}));
  setTimeout(check, 3500);
  setInterval(() => {
    if (updateReady) offerUpdate().catch(() => {});
    else check();
  }, 3600000);
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
