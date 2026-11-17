'use strict';

const { app, BrowserWindow, ipcMain, session, shell, Menu, screen, webContents, dialog, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

// Optional: separate profile folder (e.g. a second set of accounts, or testing).
if (process.env.WEB_MULTIVIEW_PROFILE) {
  app.setPath('userData', path.resolve(process.env.WEB_MULTIVIEW_PROFILE));
}

const APP_ID = 'local.webmultiview';
app.setAppUserModelId(APP_ID); // Windows toast notifications (Gmail, Calendar) need this.

// All panes share one persistent partition: log in once (Google, Microsoft, ...) and every
// pane and every sign-in popup reuses the same cookies.
const PARTITION = 'persist:web';

// Google (and some other sites) refuse sign-in from "embedded browsers". Electron is real
// Chromium, so present the matching plain Chrome user agent without the Electron/app tokens.
const CHROME_MAJOR = String(process.versions.chrome || '130').split('.')[0];
const USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_MAJOR}.0.0.0 Safari/537.36`;
app.userAgentFallback = USER_AGENT;

let win = null;
let webSes = null;
let state = {};
let writeTimer = null;
let uiLang = 'en';
const downloads = new Set(); // file paths of finished downloads (only these may be revealed)

const statePath = () => path.join(app.getPath('userData'), 'state.json');

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath(), 'utf8'));
  } catch {
    return {};
  }
}

function writeStateNow() {
  clearTimeout(writeTimer);
  writeTimer = null;
  try {
    fs.mkdirSync(path.dirname(statePath()), { recursive: true });
    const tmp = statePath() + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
    fs.renameSync(tmp, statePath());
  } catch (err) {
    console.error('Could not write state:', err);
  }
}

function scheduleWrite() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(writeStateNow, 500);
}

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

function isHttp(url) {
  try {
    const p = new URL(url).protocol;
    return p === 'http:' || p === 'https:';
  } catch {
    return false;
  }
}

// Only these non-web links are handed to Windows (mail client, phone app, Teams/Zoom/Meet apps).
function isExternalScheme(url) {
  try {
    return ['mailto:', 'tel:', 'msteams:', 'zoommtg:', 'callto:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

/* ================= Main-process UI strings (context menu, dialogs) ================= */

const STR = {
  en: {
    back: 'Back',
    forward: 'Forward',
    reload: 'Reload',
    openLinkPane: 'Open link in new pane',
    openLinkBrowser: 'Open link in default browser',
    copyLink: 'Copy link address',
    copyImage: 'Copy image',
    copyImageAddr: 'Copy image address',
    openImagePane: 'Open image in new pane',
    addToDict: 'Add to dictionary',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    pastePlain: 'Paste as plain text',
    selectAll: 'Select all',
    search: 'Search the web for "{q}"',
    inspect: 'Inspect',
    permTitle: 'Permission request',
    permAsk: '{site} wants to {what}.',
    permAllow: 'Allow',
    permBlock: 'Block',
    permRemember: 'Remember for this site',
    'perm.media': 'use your camera and/or microphone',
    'perm.media.audio': 'use your microphone',
    'perm.media.video': 'use your camera',
    'perm.notifications': 'show notifications',
    'perm.geolocation': 'know your location',
    'perm.clipboard-read': 'read your clipboard',
  },
  nl: {
    back: 'Terug',
    forward: 'Vooruit',
    reload: 'Herladen',
    openLinkPane: 'Link openen in nieuw paneel',
    openLinkBrowser: 'Link openen in standaardbrowser',
    copyLink: 'Linkadres kopiëren',
    copyImage: 'Afbeelding kopiëren',
    copyImageAddr: 'Afbeeldingsadres kopiëren',
    openImagePane: 'Afbeelding openen in nieuw paneel',
    addToDict: 'Toevoegen aan woordenboek',
    undo: 'Ongedaan maken',
    redo: 'Opnieuw',
    cut: 'Knippen',
    copy: 'Kopiëren',
    paste: 'Plakken',
    pastePlain: 'Plakken als platte tekst',
    selectAll: 'Alles selecteren',
    search: 'Op het web zoeken naar "{q}"',
    inspect: 'Inspecteren',
    permTitle: 'Toestemming gevraagd',
    permAsk: '{site} wil {what}.',
    permAllow: 'Toestaan',
    permBlock: 'Blokkeren',
    permRemember: 'Onthouden voor deze website',
    'perm.media': 'je camera en/of microfoon gebruiken',
    'perm.media.audio': 'je microfoon gebruiken',
    'perm.media.video': 'je camera gebruiken',
    'perm.notifications': 'meldingen tonen',
    'perm.geolocation': 'je locatie weten',
    'perm.clipboard-read': 'je klembord lezen',
  },
};

function s(key, params) {
  const table = STR[uiLang] || STR.en;
  let v = key in table ? table[key] : STR.en[key] || key;
  if (params) v = v.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
  return v;
}

/* ================= Shortcuts ================= */

// Holding a key down only repeats these; structural actions (split, close, ...) fire once per press.
const REPEATABLE = new Set(['zoom-in', 'zoom-out', 'next-ws', 'prev-ws', 'back', 'forward']);

// One shortcut map for both the app UI and every pane.
function shortcutFor(input) {
  if (input.type !== 'keyDown') return null;
  const k = (input.key || '').toLowerCase();
  const ctrl = input.control || input.meta;
  const shift = input.shift;
  if (input.alt) {
    if (ctrl || shift) return null;
    if (k === 'arrowleft') return 'back';
    if (k === 'arrowright') return 'forward';
    return null;
  }
  if (k === 'f11') return 'fullscreen';
  if (k === 'f5') return shift ? 'reload-all' : 'reload';
  if (!ctrl) return null;
  if (k === 'd') return shift ? 'split-down' : 'split-right';
  if (k === 'w') return 'close-pane';
  if (k === 'r') return shift ? 'reload-all' : 'reload';
  if (k === 'enter') return 'maximize';
  if (k === 't') return 'new-ws';
  if (k === 'tab') return shift ? 'prev-ws' : 'next-ws';
  if (k === 'g') return 'grid';
  if (k === 'l') return 'focus-address';
  if (k === '=' || k === '+') return 'zoom-in';
  if (k === '-') return 'zoom-out';
  if (k === '0') return 'zoom-reset';
  if (shift && k === 'i') return 'devtools';
  if (/^[1-9]$/.test(k)) return 'ws-' + k;
  return null;
}

/* ================= Main window ================= */

function boundsVisible(b) {
  if (!b || typeof b.x !== 'number' || typeof b.y !== 'number') return false;
  const d = screen.getDisplayMatching(b);
  const a = d.workArea;
  return b.x < a.x + a.width - 50 && b.y < a.y + a.height - 50 && b.x + b.width > a.x + 50 && b.y >= a.y - 10;
}

function createWindow() {
  const saved = state.window || {};
  const bounds = boundsVisible(saved.bounds) ? saved.bounds : { width: 1600, height: 950 };

  win = new BrowserWindow({
    ...bounds,
    minWidth: 640,
    minHeight: 420,
    backgroundColor: '#0f1115',
    title: 'Web Multiview',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webviewTag: true,
      spellcheck: false,
    },
  });

  if (saved.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Harden every <webview>: no preload, no Node, sandboxed, http(s) only, shared web partition only.
  win.webContents.on('will-attach-webview', (event, webPreferences, params) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
    webPreferences.nodeIntegrationInSubFrames = false;
    webPreferences.contextIsolation = true;
    webPreferences.sandbox = true;
    webPreferences.webSecurity = true;
    webPreferences.spellcheck = true;
    const srcOk = !params.src || params.src === 'about:blank' || isHttp(params.src);
    if (params.partition !== PARTITION || !srcOk) event.preventDefault();
  });

  // The app shell itself never navigates or opens windows.
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  win.webContents.on('before-input-event', (event, input) => {
    const sc = shortcutFor(input);
    if (sc) {
      event.preventDefault();
      if (!input.isAutoRepeat || REPEATABLE.has(sc)) win.webContents.send('shortcut', sc, null);
    }
  });

  win.on('close', () => {
    state.window = { bounds: win.getNormalBounds(), maximized: win.isMaximized() };
    writeStateNow();
  });
  win.on('closed', () => {
    win = null;
    // Sign-in popups belong to the main window; close them with it.
    BrowserWindow.getAllWindows().forEach((w) => w.close());
  });
}

/* ================= Web session: permissions, downloads ================= */

// Harmless permissions that a normal browser grants without asking.
const AUTO_ALLOW = new Set(['fullscreen', 'clipboard-sanitized-write', 'pointerLock', 'keyboardLock']);
// Permissions the user is asked about once per site (answer can be remembered).
const ASKABLE = new Set(['media', 'notifications', 'geolocation', 'clipboard-read']);

const sitePerms = () => (state.sitePermissions && typeof state.sitePermissions === 'object' ? state.sitePermissions : (state.sitePermissions = {}));

function permKey(permission, details) {
  if (permission !== 'media') return permission;
  const types = (details && details.mediaTypes) || [];
  if (types.length === 1) return 'media.' + types[0]; // 'media.audio' or 'media.video'
  return 'media';
}

function savedDecision(origin, key) {
  const rec = sitePerms()[origin];
  if (!rec) return undefined;
  if (typeof rec[key] === 'boolean') return rec[key];
  // A remembered "camera + microphone" answer also covers a request for just one of them.
  if (key.startsWith('media.') && typeof rec.media === 'boolean') return rec.media;
  return undefined;
}

const pendingAsks = new Map(); // origin|key -> [callbacks]

async function askPermission(wc, origin, key, callback) {
  const id = origin + '|' + key;
  if (pendingAsks.has(id)) {
    pendingAsks.get(id).push(callback);
    return;
  }
  pendingAsks.set(id, [callback]);
  let allow = false;
  try {
    const parent = BrowserWindow.fromWebContents(wc.hostWebContents || wc) || win;
    const host = new URL(origin).host;
    const res = await dialog.showMessageBox(parent, {
      type: 'question',
      title: s('permTitle'),
      message: s('permAsk', { site: host, what: s('perm.' + key) }),
      buttons: [s('permAllow'), s('permBlock')],
      defaultId: 1,
      cancelId: 1,
      noLink: true,
      checkboxLabel: s('permRemember'),
      checkboxChecked: true,
    });
    allow = res.response === 0;
    if (res.checkboxChecked) {
      sitePerms()[origin] = { ...(sitePerms()[origin] || {}), [key]: allow };
      scheduleWrite();
    }
  } catch {
    allow = false;
  }
  const cbs = pendingAsks.get(id) || [];
  pendingAsks.delete(id);
  cbs.forEach((cb) => cb(allow));
}

function uniqueDownloadPath(dir, name) {
  const safe = (name || 'download').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 200) || 'download';
  const ext = path.extname(safe);
  const base = safe.slice(0, safe.length - ext.length);
  let p = path.join(dir, safe);
  for (let i = 1; fs.existsSync(p); i++) p = path.join(dir, `${base} (${i})${ext}`);
  return p;
}

function setupSessions() {
  webSes = session.fromPartition(PARTITION);
  webSes.setUserAgent(USER_AGENT);
  try {
    webSes.setSpellCheckerLanguages(['nl', 'en-US']);
  } catch {
    /* dictionaries not available */
  }

  webSes.setPermissionRequestHandler((wc, permission, callback, details) => {
    const origin = originOf(details.requestingUrl || (wc && wc.getURL()));
    if (!origin || !isHttp(origin)) return callback(false);
    if (AUTO_ALLOW.has(permission)) return callback(true);
    if (!ASKABLE.has(permission)) return callback(false);
    const key = permKey(permission, details);
    const saved = savedDecision(origin, key);
    if (typeof saved === 'boolean') return callback(saved);
    askPermission(wc, origin, key, callback);
  });

  webSes.setPermissionCheckHandler((_wc, permission, requestingOrigin, details) => {
    const origin = originOf(requestingOrigin);
    if (!origin || !isHttp(origin)) return false;
    if (AUTO_ALLOW.has(permission)) return true;
    if (!ASKABLE.has(permission)) return false;
    const key = permission === 'media' && details && details.mediaType ? 'media.' + details.mediaType : permission;
    return savedDecision(origin, key) === true;
  });

  // Downloads go straight to the Windows Downloads folder; the shell shows a small notice.
  webSes.on('will-download', (_event, item) => {
    const target = uniqueDownloadPath(app.getPath('downloads'), item.getFilename());
    item.setSavePath(target);
    const name = path.basename(target);
    if (win) win.webContents.send('download', { state: 'started', name });
    item.once('done', (_e, st) => {
      if (st === 'completed') downloads.add(target);
      if (win) win.webContents.send('download', { state: st, name, path: st === 'completed' ? target : null });
    });
  });

  // The app shell needs no permissions at all.
  session.defaultSession.setPermissionRequestHandler((_wc, _p, callback) => callback(false));
}

/* ================= Every web page (panes and sign-in popups) ================= */

function sendOpenInPane(url, fromWc) {
  if (!win || !isHttp(url)) return;
  win.webContents.send('open-in-pane', url, fromWc ? fromWc.id : null);
  if (win.isMinimized()) win.restore();
}

function buildContextMenu(contents, p) {
  const items = [];
  const sep = () => {
    if (items.length && items[items.length - 1].type !== 'separator') items.push({ type: 'separator' });
  };
  const ef = p.editFlags || {};

  if (p.linkURL && isHttp(p.linkURL)) {
    items.push({ label: s('openLinkPane'), click: () => sendOpenInPane(p.linkURL, contents) });
    items.push({ label: s('openLinkBrowser'), click: () => shell.openExternal(p.linkURL) });
    items.push({ label: s('copyLink'), click: () => clipboard.writeText(p.linkURL) });
  } else if (p.linkURL && isExternalScheme(p.linkURL)) {
    items.push({ label: s('copyLink'), click: () => clipboard.writeText(p.linkURL.replace(/^mailto:/i, '')) });
  }

  if (p.mediaType === 'image' && p.srcURL) {
    sep();
    items.push({ label: s('copyImage'), click: () => contents.copyImageAt(p.x, p.y) });
    if (isHttp(p.srcURL)) {
      items.push({ label: s('copyImageAddr'), click: () => clipboard.writeText(p.srcURL) });
      items.push({ label: s('openImagePane'), click: () => sendOpenInPane(p.srcURL, contents) });
    }
  }

  if (p.misspelledWord) {
    sep();
    (p.dictionarySuggestions || []).slice(0, 5).forEach((w) => items.push({ label: w, click: () => contents.replaceMisspelling(w) }));
    items.push({ label: s('addToDict'), click: () => contents.session.addWordToSpellCheckerDictionary(p.misspelledWord) });
  }

  if (p.isEditable) {
    sep();
    items.push({ label: s('undo'), enabled: !!ef.canUndo, click: () => contents.undo() });
    items.push({ label: s('redo'), enabled: !!ef.canRedo, click: () => contents.redo() });
    sep();
    items.push({ label: s('cut'), enabled: !!ef.canCut, click: () => contents.cut() });
    items.push({ label: s('copy'), enabled: !!ef.canCopy, click: () => contents.copy() });
    items.push({ label: s('paste'), enabled: !!ef.canPaste, click: () => contents.paste() });
    items.push({ label: s('pastePlain'), enabled: !!ef.canPaste, click: () => contents.pasteAndMatchStyle() });
    items.push({ label: s('selectAll'), enabled: !!ef.canSelectAll, click: () => contents.selectAll() });
  } else if (p.selectionText && p.selectionText.trim()) {
    sep();
    const q = p.selectionText.trim().replace(/\s+/g, ' ');
    items.push({ label: s('copy'), click: () => contents.copy() });
    items.push({
      label: s('search', { q: q.length > 30 ? q.slice(0, 30) + '…' : q }),
      click: () => sendOpenInPane('https://www.google.com/search?q=' + encodeURIComponent(q.slice(0, 500)), contents),
    });
  }

  if (!items.length) {
    const nav = contents.navigationHistory;
    items.push({ label: s('back'), enabled: nav ? nav.canGoBack() : false, click: () => nav && nav.goBack() });
    items.push({ label: s('forward'), enabled: nav ? nav.canGoForward() : false, click: () => nav && nav.goForward() });
    items.push({ label: s('reload'), click: () => contents.reload() });
  }

  sep();
  items.push({ label: s('inspect'), click: () => contents.inspectElement(p.x, p.y) });
  return Menu.buildFromTemplate(items);
}

app.on('web-contents-created', (_event, contents) => {
  const type = contents.getType();
  if (type !== 'webview' && type !== 'window') return;
  // Only web pages (panes and the popups they open) live in the web partition; the shell does not.
  if (!webSes || contents.session !== webSes) return;
  const isPane = type === 'webview';

  if (isPane) {
    contents.on('before-input-event', (event, input) => {
      const sc = shortcutFor(input);
      if (sc && win) {
        event.preventDefault();
        if (!input.isAutoRepeat || REPEATABLE.has(sc)) win.webContents.send('shortcut', sc, contents.id);
      }
    });

    // Tell the shell which pane the user is working in (clicks inside a page never reach the shell DOM).
    const reportFocus = () => {
      if (win) win.webContents.send('webview-focus', contents.id);
    };
    contents.on('focus', reportFocus);
    contents.on('before-mouse-event', (_event, mouse) => {
      if (mouse.type === 'mouseDown') reportFocus();
    });
  }

  contents.on('context-menu', (_e, params) => {
    const parent = BrowserWindow.fromWebContents(contents.hostWebContents || contents) || win;
    buildContextMenu(contents, params).popup({ window: parent });
  });

  // New windows:
  //  - real popups (window.open with size features, e.g. "Sign in with Google", Gmail pop-out compose)
  //    open as a small separate window that shares the login session, so OAuth flows keep working;
  //  - links meant for a new tab (target=_blank, middle click) open in a new pane next to this one;
  //  - mailto:/tel: and app links go to Windows.
  contents.setWindowOpenHandler(({ url, disposition }) => {
    if (isExternalScheme(url)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    const blank = !url || url === 'about:blank';
    if (!blank && !isHttp(url)) return { action: 'deny' };
    if (disposition === 'new-window' || blank) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1000,
          height: 760,
          autoHideMenuBar: true,
          backgroundColor: '#ffffff',
          icon: path.join(__dirname, 'assets', 'icon.png'),
          webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, spellcheck: true },
        },
      };
    }
    sendOpenInPane(url, isPane ? contents : null);
    return { action: 'deny' };
  });

  contents.on('will-navigate', (event, url) => {
    if (isHttp(url)) return;
    event.preventDefault();
    if (isExternalScheme(url)) shell.openExternal(url);
  });
});

// Invalid HTTPS certificates are never accepted (Electron's default: the page fails to load).

/* ================= IPC from the shell ================= */

const fromShell = (event) => !!win && event.sender === win.webContents;

ipcMain.handle('state:load', (event) => (fromShell(event) ? state : null));

ipcMain.on('state:save', (event, next) => {
  if (!fromShell(event) || !next || typeof next !== 'object') return;
  state = { ...next, window: state.window, sitePermissions: state.sitePermissions };
  scheduleWrite();
});

ipcMain.on('ui:lang', (event, lang) => {
  if (fromShell(event) && STR[lang]) uiLang = lang;
});

ipcMain.on('win:fullscreen', (event) => {
  if (fromShell(event)) win.setFullScreen(!win.isFullScreen());
});

// Per-pane zoom. Chromium shares normal page zoom between all pages of the same origin,
// so two Gmail panes would zoom together. Instead each pane gets its own emulated viewport
// (size / zoom) that is scaled back to the pane size, like browser zoom but per pane.
ipcMain.on('pane:zoom', (event, wcId, zoom, width, height) => {
  if (!fromShell(event)) return;
  const wc = webContents.fromId(Number(wcId));
  if (!wc || wc.isDestroyed() || wc.getType() !== 'webview' || wc.hostWebContents !== win.webContents) return;
  const z = Number(zoom);
  const w = Math.round(Number(width));
  const h = Math.round(Number(height));
  if (!(z > 0) || Math.abs(z - 1) < 0.001 || !(w > 0 && h > 0)) {
    wc.disableDeviceEmulation();
    return;
  }
  const size = { width: Math.max(1, Math.round(w / z)), height: Math.max(1, Math.round(h / z)) };
  wc.enableDeviceEmulation({
    screenPosition: 'desktop',
    screenSize: size,
    viewPosition: { x: 0, y: 0 },
    deviceScaleFactor: 0,
    viewSize: size,
    scale: z,
  });
});

ipcMain.on('download:show', (event, file) => {
  if (fromShell(event) && downloads.has(file) && fs.existsSync(file)) shell.showItemInFolder(file);
});

ipcMain.handle('session:clear', async (event) => {
  if (!fromShell(event)) return false;
  await webSes.clearStorageData();
  await webSes.clearCache();
  await webSes.clearAuthCache();
  BrowserWindow.getAllWindows().forEach((w) => {
    if (w !== win) w.close(); // sign-in popups belong to the old session
  });
  return true;
});

ipcMain.handle('permissions:reset', (event) => {
  if (!fromShell(event)) return false;
  state.sitePermissions = {};
  writeStateNow();
  return true;
});

/* ================= Lifecycle ================= */

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
  });

  app.whenReady().then(() => {
    state = readState();
    Menu.setApplicationMenu(null);
    setupSessions();
    createWindow();
  });

  app.on('window-all-closed', () => app.quit());
  app.on('will-quit', () => {
    if (writeTimer) writeStateNow();
  });
}
