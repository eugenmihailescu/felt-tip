# Felt Tip

Felt Tip is an unpacked Manifest V3 extension for desktop Chrome and Brave. It is plain JavaScript, with no build and no npm dependencies. Marks are drawn on the live page. It does not take a screenshot or record the screen.

## Commands

- `npm test` runs `node --test`. Run it after any change under `src/` or `test/`.
- There is no lint, format, or build script. Do not invent one.
- Install is **Load unpacked** on this folder. After a manifest or script change, reload the extension at `chrome://extensions` or `brave://extensions`.

## Where things live

There is no `docs/` directory. Do not look for one. Read `README.md` only when install steps, the permission story, or the user-facing description might change.

- `manifest.json` — service worker, content scripts, permissions, web-accessible modules.
- `src/background/service-worker.js` — toolbar click, restore injection, blocked-page window.
- `src/page/annotate.js` — tools and marks. Injected by the service worker. Not a content script.
- `src/page/restore.js` — content script. Asks the worker to inject the annotator when this address has saved marks.
- `src/page/history-hook.js` — MAIN-world content script. Wraps `history.pushState` and `history.replaceState`.
- `src/lib/annotations.js`, `geometry.js`, `storage.js` — modules the page loads.
- `src/lib/pages.js` — which URLs may be scripted. Service worker only.
- `src/message/` — window shown on tabs that cannot be scripted.
- `icons/` — toolbar icon. In-page tool glyphs are the `ICONS` strings in `annotate.js`.
- `test/` — `node:test` files. `npm test` discovers them.

## Rules

Observed:

- `src/page/annotate.js`, `restore.js`, and `history-hook.js` stay classic scripts: no static `import` or `export`. The first two load modules with a dynamic `import()`. `test/files.test.js` checks this. The service worker and `src/lib/*.js` are ES modules (`package.json` `"type": "module"`, `manifest.json` `background.type`).
- `history-hook.js` runs in the page MAIN world (`manifest.json`, comment in `history-hook.js`). An isolated-world wrapper does not see the page's `history.pushState`.
- A module the page loads, including a static import of one, must be listed in `web_accessible_resources`. Today that is `src/lib/annotations.js`, `geometry.js`, and `storage.js`. `pages.js` is service-worker only.
- Scripting is limited to `http`, `https`, and `file` (`src/lib/pages.js`). Other tabs get `src/message/message.html`. Content scripts use those matches, `all_frames` is false, and there is no action popup. `test/manifest.test.js` asserts that shape.
- Marks and tool prefs persist in `chrome.storage.local` under `tool`, `pages`, and `lifetime` (`src/lib/storage.js`). The address key is origin, path, and query. The hash is ignored. A `file:` key uses the origin `"null"` (`test/storage.test.js`). At most 100 page records. Lifetimes are `30m`, `1h`, `12h`, `1d`, `1w`, `1mo`, and `forever`. A month is 30 days.
- Writes go through `normalizeToolPrefs` and `normalizeAnnotations`. Unknown mark types are dropped (`MARK_TYPES` in `src/lib/annotations.js`).
- Marks live in the open shadow tree of `#felt-tip`. Closing the panel hides the tools and leaves the host. A second injection while `__feltTipActive` toggles the panel.
- `package.json` has no dependencies and one script, `test` (`node --test`). No fetch client.

Proposed (not written down elsewhere in the repo):

- Do not add a dependency, bundler, or extra npm script unless asked. Chrome loads these files as they are.
- Done means `npm test` passes. Injection, restore, panel, or theme changes also need a reload of the unpacked extension. Nothing in the repo runs a browser.
- Leave `annotate.js` alone outside the behavior you were asked to change. Drawing, the panel, hit testing, and saving share one IIFE.
