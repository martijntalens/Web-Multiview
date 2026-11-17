# Web Multiview

A Windows desktop app for multitasking: open as many websites as you like side by side in one window, such as Gmail, Google Calendar and Drive. Every pane is a full Chromium browser, and all panes share one sign-in session.

## Features

- **Unlimited panes** in a split layout. Drag the dividers to resize, and drag panes to swap them, dock them or move them to another workspace.
- **Workspaces** shown as tabs. Ready-made layouts (2/3/4 columns, 2×2, 3×3 and more) and an auto-grid.
- **One shared login.** Sign in once and every pane and popup uses it. The session is kept across restarts.
- **Address bar** that accepts an address or search terms. The search engine can be Google, Bing or DuckDuckGo.
- **Popups.** OAuth popups ("Sign in with Google") open as real windows. "Open in new tab" links open in a new pane.
- **Per-site permissions** for camera, microphone, notifications and location. You are asked once per site and the choice is remembered.
- **Downloads** are saved to the Downloads folder and shown as toasts.
- **Context menu** with clipboard actions, link actions and spellcheck (nl and en-US).
- **Per-pane zoom**, maximise, and favourites.
- **UI languages:** English and Dutch.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| Ctrl+D / Ctrl+Shift+D | Split right / down |
| Ctrl+W | Close pane |
| Ctrl+Enter | Maximise pane |
| Ctrl+R / F5, Ctrl+Shift+R | Reload pane / all panes |
| Alt+← / Alt+→ | Back / forward |
| Ctrl+L | Focus the address bar |
| Ctrl++ / Ctrl+- / Ctrl+0 | Zoom pane |
| Ctrl+G | Auto grid |
| Ctrl+T, Ctrl+Tab, Ctrl+1…9 | New / next / go to workspace |
| F11 | Fullscreen |

## Development

These commands need Node.js 20 or later.

Install the dependencies:

```bash
npm install
```

Run the app in development mode:

```bash
npm start
```

Build the Windows installer (NSIS, per-user) into `dist/`:

```bash
npm run dist
```

> On Windows, NSIS fails when the project path is longer than 260 characters. If the build fails on an `!include`, build from a shorter path, for example a drive mapped with `subst`.

## Security notes

- Electron fuses are set in the build: no `RunAsNode`, no `NODE_OPTIONS`, no CLI inspect, ASAR integrity checking, and the app loads only from the ASAR archive.
- Cookies are encrypted at rest with Windows DPAPI (`enableCookieEncryption`).
- Webviews are locked to `http(s)` URLs and to a single persistent partition. Other schemes, such as `mailto:` and `msteams:`, are handed to the operating system.
- **Clear session** in Settings wipes all cookies, storage and cache.
- The installer is not code-signed, so Windows SmartScreen shows a warning on first run.

## License

MIT
