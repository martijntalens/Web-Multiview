'use strict';

/*
 * UI translations. Every visible string of the app shell lives here.
 *
 * - `t(key, params)` returns the string for the current language; `{name}` placeholders are
 *   filled from `params`. Missing keys fall back to English, then to the key itself.
 * - Static markup uses attributes that `applyI18n(root)` fills in:
 *   data-i18n (text), data-i18n-title, data-i18n-placeholder, data-i18n-aria-label.
 * - The language setting is 'auto' (follow Windows), 'en' or 'nl'.
 */
(() => {
  const STRINGS = {
    en: {
      'app.workspaces': 'Workspaces',

      'toolbar.pane': 'Pane',
      'toolbar.newPane': 'New pane (Ctrl+D)',
      'toolbar.openFavorite': 'Open favorite in new pane',
      'toolbar.layout': 'Layout',
      'toolbar.reloadAll': 'Reload all panes (Ctrl+Shift+R)',
      'toolbar.fullscreen': 'Full screen (F11)',
      'toolbar.settings': 'Settings',

      'empty.noPanes': 'No panes yet',
      'empty.text': 'Put Gmail, Calendar, Drive and any other website side by side, as many as you like. Log in once and every pane stays logged in.',
      'empty.addPane': 'Add pane',
      'empty.starter': 'Gmail + Calendar + Drive',

      'pane.drag': 'Drag: swap, dock next to another pane, or move to a workspace tab',
      'pane.back': 'Back (Alt+Left)',
      'pane.forward': 'Forward (Alt+Right)',
      'pane.reload': 'Reload (Ctrl+R)',
      'pane.favorites': 'Favorites',
      'pane.address': 'Address',
      'pane.addressPlaceholder': 'Search or type an address',
      'pane.zoomOut': 'Zoom out (Ctrl+-)',
      'pane.zoomReset': 'Reset zoom (Ctrl+0)',
      'pane.zoomIn': 'Zoom in (Ctrl++)',
      'pane.splitRight': 'Split right (Ctrl+D)',
      'pane.splitDown': 'Split down (Ctrl+Shift+D)',
      'pane.maximize': 'Maximize (Ctrl+Enter)',
      'pane.restore': 'Restore (Ctrl+Enter)',
      'pane.close': 'Close pane (Ctrl+W)',
      'pane.retry': 'Try again',
      'pane.fallbackLabel': 'Pane',

      'error.loadFailed': 'Cannot load the page',
      'error.unknown': 'Unknown error',
      'error.crashed': 'This pane crashed',
      'error.crashedDetail': 'Click "Try again" to reload it.',

      'ws.defaultName': 'Workspace {n}',
      'ws.fallbackName': 'Workspace',
      'ws.tabTitle': 'Double-click to rename',
      'ws.close': 'Close workspace',
      'ws.new': 'New workspace (Ctrl+T)',
      'ws.confirmCloseOne': 'Close workspace "{name}" with 1 pane?',
      'ws.confirmCloseMany': 'Close workspace "{name}" with {count} panes?',
      'ws.rename': 'Rename workspace',

      'menu.addCurrentFavorite': 'Add current page to favorites',
      'menu.manageFavorites': 'Manage favorites…',
      'menu.openInNewPane': 'Open in new pane',
      'menu.startPage': 'Start page',
      'menu.layoutHeading': 'Layout (adds new panes when needed)',
      'menu.sideBySide': '{n} side by side',
      'menu.stacked': '{n} stacked',
      'menu.autoGrid': 'Auto grid',
      'menu.equalize': 'Equalize',
      'menu.favoriteName': 'Name for favorite ({path})',

      'settings.title': 'Settings',
      'settings.homePage': 'Start page for new panes',
      'settings.searchEngine': 'Search engine for the address bar',
      'settings.favorites': 'Favorites',
      'settings.favoritesHint': 'one per line:',
      'settings.favoritesFormat': 'Name | https://address',
      'settings.language': 'Language',
      'settings.languageAuto': 'Automatic (Windows language)',
      'settings.restoreSession': 'Restore workspaces and panes on startup',
      'settings.shortcuts': 'Keyboard shortcuts',
      'settings.clearSession': 'Log out everywhere and clear data',
      'settings.resetPermissions': 'Reset site permissions',
      'settings.cancel': 'Cancel',
      'settings.save': 'Save',
      'settings.confirmClear': 'You will be logged out of every website in all panes, and stored cookies, cache and site data will be deleted. Continue?',
      'settings.confirmResetPerms': 'Forget all remembered camera, microphone, notification and location decisions? Websites will ask again.',
      'settings.permsReset': 'Site permissions were reset.',

      'download.started': 'Downloading {name}…',
      'download.done': '{name} downloaded',
      'download.show': 'Show in folder',
      'download.failed': 'Download failed: {name}',

      'keys.splitRight': 'Split pane right',
      'keys.splitDown': 'Split pane down',
      'keys.close': 'Close pane',
      'keys.maximize': 'Maximize / restore pane',
      'keys.reload': 'Reload pane',
      'keys.reloadAll': 'Reload all panes',
      'keys.backForward': 'Back / forward',
      'keys.address': "Go to the pane's address bar",
      'keys.zoom': 'Pane zoom',
      'keys.grid': 'Auto grid',
      'keys.newWs': 'New workspace',
      'keys.switchWs': 'Switch workspace',
      'keys.fullscreen': 'Full screen',
      'keys.devtools': 'DevTools for the pane',
      'keys.dragHint': 'Drag a pane by its ⠿ handle onto another pane: centre = swap, edge = dock next to it, onto a tab = move to that workspace. Right-click a link to open it in a new pane.',

      'ask.cancel': 'Cancel',
      'ask.ok': 'OK',

      'fav.gmail': 'Gmail',
      'fav.calendar': 'Google Calendar',
      'fav.drive': 'Google Drive',
      'fav.docs': 'Google Docs',
      'fav.sheets': 'Google Sheets',
      'fav.keep': 'Google Keep',
      'fav.meet': 'Google Meet',
      'fav.whatsapp': 'WhatsApp',
    },

    nl: {
      'app.workspaces': 'Werkruimtes',

      'toolbar.pane': 'Paneel',
      'toolbar.newPane': 'Nieuw paneel (Ctrl+D)',
      'toolbar.openFavorite': 'Favoriet openen in nieuw paneel',
      'toolbar.layout': 'Indeling',
      'toolbar.reloadAll': 'Alle panelen herladen (Ctrl+Shift+R)',
      'toolbar.fullscreen': 'Volledig scherm (F11)',
      'toolbar.settings': 'Instellingen',

      'empty.noPanes': 'Nog geen panelen',
      'empty.text': 'Zet Gmail, Agenda, Drive en elke andere website naast elkaar, zoveel als je wilt. Log één keer in en elk paneel blijft ingelogd.',
      'empty.addPane': 'Paneel toevoegen',
      'empty.starter': 'Gmail + Agenda + Drive',

      'pane.drag': 'Slepen: wisselen, ernaast plaatsen of naar een werkruimte-tab',
      'pane.back': 'Terug (Alt+Links)',
      'pane.forward': 'Vooruit (Alt+Rechts)',
      'pane.reload': 'Herladen (Ctrl+R)',
      'pane.favorites': 'Favorieten',
      'pane.address': 'Adres',
      'pane.addressPlaceholder': 'Zoek of typ een adres',
      'pane.zoomOut': 'Uitzoomen (Ctrl+-)',
      'pane.zoomReset': 'Zoom herstellen (Ctrl+0)',
      'pane.zoomIn': 'Inzoomen (Ctrl++)',
      'pane.splitRight': 'Splits naar rechts (Ctrl+D)',
      'pane.splitDown': 'Splits naar beneden (Ctrl+Shift+D)',
      'pane.maximize': 'Maximaliseren (Ctrl+Enter)',
      'pane.restore': 'Herstellen (Ctrl+Enter)',
      'pane.close': 'Paneel sluiten (Ctrl+W)',
      'pane.retry': 'Opnieuw proberen',
      'pane.fallbackLabel': 'Paneel',

      'error.loadFailed': 'Kan de pagina niet laden',
      'error.unknown': 'Onbekende fout',
      'error.crashed': 'Dit paneel is gecrasht',
      'error.crashedDetail': 'Klik op opnieuw proberen om het te herladen.',

      'ws.defaultName': 'Werkruimte {n}',
      'ws.fallbackName': 'Werkruimte',
      'ws.tabTitle': 'Dubbelklik om te hernoemen',
      'ws.close': 'Werkruimte sluiten',
      'ws.new': 'Nieuwe werkruimte (Ctrl+T)',
      'ws.confirmCloseOne': 'Werkruimte "{name}" met 1 paneel sluiten?',
      'ws.confirmCloseMany': 'Werkruimte "{name}" met {count} panelen sluiten?',
      'ws.rename': 'Werkruimte hernoemen',

      'menu.addCurrentFavorite': 'Huidige pagina toevoegen aan favorieten',
      'menu.manageFavorites': 'Favorieten beheren…',
      'menu.openInNewPane': 'Openen in nieuw paneel',
      'menu.startPage': 'Startpagina',
      'menu.layoutHeading': 'Indeling (vult aan met nieuwe panelen)',
      'menu.sideBySide': '{n} naast elkaar',
      'menu.stacked': '{n} boven elkaar',
      'menu.autoGrid': 'Automatisch raster',
      'menu.equalize': 'Gelijk verdelen',
      'menu.favoriteName': 'Naam voor favoriet ({path})',

      'settings.title': 'Instellingen',
      'settings.homePage': 'Startpagina voor nieuwe panelen',
      'settings.searchEngine': 'Zoekmachine voor de adresbalk',
      'settings.favorites': 'Favorieten',
      'settings.favoritesHint': 'één per regel:',
      'settings.favoritesFormat': 'Naam | https://adres',
      'settings.language': 'Taal',
      'settings.languageAuto': 'Automatisch (taal van Windows)',
      'settings.restoreSession': 'Werkruimtes en panelen herstellen bij opstarten',
      'settings.shortcuts': 'Sneltoetsen',
      'settings.clearSession': 'Overal uitloggen en gegevens wissen',
      'settings.resetPermissions': 'Websitetoestemmingen resetten',
      'settings.cancel': 'Annuleren',
      'settings.save': 'Opslaan',
      'settings.confirmClear': 'Je wordt in alle panelen bij elke website uitgelogd en opgeslagen cookies, cache en websitegegevens worden gewist. Doorgaan?',
      'settings.confirmResetPerms': 'Alle onthouden keuzes voor camera, microfoon, meldingen en locatie vergeten? Websites vragen het dan opnieuw.',
      'settings.permsReset': 'Websitetoestemmingen zijn gereset.',

      'download.started': '{name} wordt gedownload…',
      'download.done': '{name} gedownload',
      'download.show': 'Tonen in map',
      'download.failed': 'Downloaden mislukt: {name}',

      'keys.splitRight': 'Paneel naar rechts splitsen',
      'keys.splitDown': 'Paneel naar beneden splitsen',
      'keys.close': 'Paneel sluiten',
      'keys.maximize': 'Paneel maximaliseren / herstellen',
      'keys.reload': 'Paneel herladen',
      'keys.reloadAll': 'Alle panelen herladen',
      'keys.backForward': 'Terug / vooruit',
      'keys.address': 'Naar adresbalk van paneel',
      'keys.zoom': 'Zoom van paneel',
      'keys.grid': 'Automatisch raster',
      'keys.newWs': 'Nieuwe werkruimte',
      'keys.switchWs': 'Wisselen van werkruimte',
      'keys.fullscreen': 'Volledig scherm',
      'keys.devtools': 'DevTools van paneel',
      'keys.dragHint': 'Sleep een paneel aan het ⠿-handvat naar een ander paneel: midden = wisselen, rand = ernaast plaatsen, op een tabblad = naar die werkruimte verplaatsen. Klik met rechts op een link om hem in een nieuw paneel te openen.',

      'ask.cancel': 'Annuleren',
      'ask.ok': 'OK',

      'fav.gmail': 'Gmail',
      'fav.calendar': 'Google Agenda',
      'fav.drive': 'Google Drive',
      'fav.docs': 'Google Documenten',
      'fav.sheets': 'Google Spreadsheets',
      'fav.keep': 'Google Keep',
      'fav.meet': 'Google Meet',
      'fav.whatsapp': 'WhatsApp',
    },
  };

  const LANGS = Object.keys(STRINGS);
  let lang = 'en';

  // 'auto' follows the Windows display language (Chromium exposes it as navigator.languages).
  function resolveLang(setting) {
    if (LANGS.includes(setting)) return setting;
    const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en']).map((l) =>
      String(l).toLowerCase().split('-')[0]
    );
    return prefs.find((l) => LANGS.includes(l)) || 'en';
  }

  function setLang(setting) {
    lang = resolveLang(setting);
    document.documentElement.lang = lang;
    return lang;
  }

  function t(key, params, forLang) {
    const table = STRINGS[forLang || lang] || STRINGS.en;
    let s = key in table ? table[key] : key in STRINGS.en ? STRINGS.en[key] : key;
    if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m));
    return s;
  }

  const ATTRS = [
    ['i18nTitle', 'title'],
    ['i18nPlaceholder', 'placeholder'],
    ['i18nAriaLabel', 'aria-label'],
  ];

  function applyI18n(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    for (const [dataKey, attr] of ATTRS) {
      const sel = '[data-' + dataKey.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()) + ']';
      root.querySelectorAll(sel).forEach((el) => el.setAttribute(attr, t(el.dataset[dataKey])));
    }
  }

  window.i18n = { t, setLang, resolveLang, applyI18n, get lang() { return lang; }, LANGS };
})();
