# Felt Tip

Underline, circle, and write on a web page. The marks stay on the page.

For desktop Chrome and Brave. Felt Tip does not take a screenshot and does not record the screen.

## Browsers

Desktop Chrome and desktop Brave. Manifest V3.

| Browser | Oldest | Newest |
| --- | --- | --- |
| Chrome | 116 (August 2023) | No maximum |
| Brave | 1.57, which is Chromium 116 (August 2023) | No maximum |

`manifest.json` sets `minimum_chrome_version` to 116, so both browsers refuse to load the extension on anything older. Felt Tip needs a Manifest V3 service worker and a content script in the page's own JavaScript world, so it can see `history.pushState` when a site changes the address without reloading. That script world has been available since Chrome 111. The manifest keeps the floor at 116.

There is no newest version. The manifest sets no maximum, so later Chrome and Brave releases keep loading it. The desktop stable releases in October 2026, Chrome 156 and Brave 1.98 (Chromium 156), are inside this range.

Chrome on Windows, macOS, Linux, and ChromeOS can load it. Brave on Windows, macOS, and Linux can load it. Each browser's own system requirements still apply. Firefox, Safari, and the Android and iOS apps are not supported.

## Install

1. Clone this repository.
2. Open `brave://extensions` (or `chrome://extensions`).
3. Turn on **Developer mode**.
4. Choose **Load unpacked** and select this folder.

After a change to the manifest or a script, reload Felt Tip from that same page.

Set site access to **On all sites** so saved marks can come back on http and https pages. On a file page, turn on **Allow access to file URLs** for Felt Tip.

## What it does

- Highlight text with a marker.
- Draw with a pen.
- Wrap an area in a rectangle or an ellipse.
- Draw an arrow.
- Place a text overlay.
- Place a numbered step.
- Blur a zone.
- Move a mark, erase a mark, and undo or redo.

Click the Felt Tip toolbar button on an http, https, or file page. The tool panel opens on that page. Click a mark to edit it with that mark's own settings. With no tool selected, drag a mark to move it. The panel follows the browser color scheme.

The marks belong to the page you are reading. They are not drawn onto a picture. Click the toolbar button again, or Close on the panel, to put the tools away. The marks stay on the page.

Saved marks for an address come back when that page loads in any tab, including a tab where the tools have not been opened. They also come back when the site changes to that address without reloading. The address key is the origin, path, and query. The hash is ignored. Felt Tip keeps the newest 100 addresses.

**Clear marks on this page** removes the saved marks for that address. The lifetime menu keeps marks for 30 minutes, 1 hour, 12 hours, 1 day, 1 week, 1 month, or forever, and removes marks that are older than the choice. A month is 30 days.

A `chrome://` tab, and any other page outside http, https, and file, gets a short message instead of the tools.

## Permissions

`activeTab`, `scripting`, and `storage`. Host access is `http://*/*`, `https://*/*`, and `file:///*`.

Felt Tip can access http, https, and file pages so it can draw saved marks where the tools have not been opened. It uses scripting to open the tools on the tab you clicked, and storage so the marks can return. Marks stay in this browser profile. Nothing is uploaded.

## Tests

```sh
npm test
```

## Privacy

Felt Tip stores marks on this browser profile and does not upload them. The policy is in [PRIVACY.md](PRIVACY.md).

## License

Felt Tip is released under the [MIT License](LICENSE).
