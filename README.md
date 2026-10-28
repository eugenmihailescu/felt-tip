# Felt Tip

Underline, circle, and write on a web page. The marks stay on the page.

For desktop Chrome and Brave. Felt Tip does not take a screenshot and does not record the screen.

## What it does

- Underline text with a fluorescent marker.
- Draw with a pen, and ring an area.
- Wrap an area in a rectangle or an ellipse.
- Place a text overlay.

The marks belong to the page you are reading. They are not drawn onto a picture.

## Install

1. Clone this repository.
2. Open `chrome://extensions` or `brave://extensions`.
3. Turn on Developer mode.
4. Choose **Load unpacked** and select this folder.

Click the Felt Tip toolbar button on an http, https, or file page. The tool panel opens on that page. Click the button again, or Close on the panel, to put the tools away. The marks stay on the page. Saved marks for an address come back when that page loads in any tab, including a tab where the tools have not been opened. They also come back when the site changes to that address without reloading. Clear marks on this page removes the saved marks for that address. The lifetime menu keeps marks for 30 minutes, 1 hour, 12 hours, 1 day, 1 week, 1 month, or forever, and removes marks that are older than the choice. On a file page, saved marks come back after Allow access to file URLs is turned on for Felt Tip. The address key is the origin, path, and query. The hash is ignored.

Felt Tip can access http, https, and file pages so it can draw those saved marks, uses scripting to open the tools on the tab you clicked, and uses storage so the marks can return. A `chrome://` tab, and any other page outside http, https, and file, gets a short message instead of the tools.
