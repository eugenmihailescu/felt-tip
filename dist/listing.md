# Felt Tip — Chrome Web Store listing

Version 0.1.0. Paste each block into the matching dashboard field.

Privacy policy URL, after this file is on the public default branch:

```
https://github.com/eugenmihailescu/felt-tip/blob/main/PRIVACY.md
```

Screenshot: `dist/store-screenshot.png` (1280×800).

## Store listing

Name:

```
Felt Tip
```

Summary (71 characters):

```
Underline, circle, and write on a web page. The marks stay on the page.
```

Description:

```
Felt Tip underlines, circles, and writes on a web page. The marks stay on the page. Felt Tip does not take a screenshot and does not record the screen.

What you can do:
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

Saved marks for an address come back when that page loads in any tab, including a tab where the tools have not been opened. They also come back when the site changes to that address without reloading. The saved address is the origin, path, and query. The hash is ignored. Felt Tip keeps the newest 100 addresses.

Clear marks on this page removes the saved marks for that address. The lifetime menu keeps marks for 30 minutes, 1 hour, 12 hours, 1 day, 1 week, 1 month, or forever, and removes marks that are older than the choice. A month is 30 days.

Felt Tip works on desktop Chrome and desktop Brave, version 116 or newer. A chrome:// tab, and any other page outside http, https, and file, gets a short message instead of the tools.

Set site access to On all sites so saved marks can come back on http and https pages. On a file page, turn on Allow access to file URLs for Felt Tip.

Felt Tip uses activeTab and scripting to open the tools on the tab you clicked. It uses storage so marks and tool settings can return. It can access http, https, and file pages so it can draw saved marks where the tools have not been opened. Marks stay in this browser profile. Nothing is uploaded.

Felt Tip is free software under the MIT License.
```

Category: Productivity

Language: English

Store icon: `icons/icon128.png` (128×128)

Distribution: Public, free, all regions. No in-app purchases.

## Privacy practices

Single purpose:

```
Draw marks on the page the user is reading, and show those saved marks again when that page is opened.
```

Permission justifications. The dashboard lists one field per manifest permission.

activeTab:

```
The toolbar button opens the drawing tools on the tab the user clicked. activeTab covers that one tab for that click.
```

scripting:

```
Felt Tip injects its drawing script into the tab so the user can add marks on the live page. The same injection draws saved marks when a page that already has marks loads.
```

storage:

```
Marks, tool settings, and the lifetime choice are saved in chrome.storage.local on this browser profile. Nothing is sent to a server.
```

http://*/* :

```
Saved marks are drawn when an http page loads, including in a tab where the user has not opened the tools. The content script has to be allowed on those pages for the marks to come back.
```

https://*/* :

```
Saved marks are drawn when an https page loads, including in a tab where the user has not opened the tools. The content script has to be allowed on those pages for the marks to come back.
```

file:///* :

```
Saved marks are drawn when a local file page loads. The user also has to turn on Allow access to file URLs. Felt Tip does not read arbitrary files. It only draws marks the user already saved for that file address.
```

Remote code:

```
No, I am not using remote code.
```

Data the extension handles. Check these:

- Web history. The address of each page the user marks. The saved key is the origin, path, and query. The hash is not stored. Only pages the user annotates are stored, and only the newest 100 addresses are kept.
- Website content. The marks the user draws on that page, including pen strokes, highlights, rectangles, ellipses, arrows, numbered steps, blur zones, and text the user types into a mark.

Leave these unchecked:

- Personally identifiable information
- Health information
- Financial and payment information
- Authentication information
- Personal communications
- Location
- User activity, when that box means clicks, mouse movement, scrolling, or keystrokes. Felt Tip does not record those. If the form instead defines user activity as content the user creates on a page, check it and use the website-content sentence above.

This data is used only to show those marks again on that page. It is not sold, not uploaded, and not shared.

Check all three limited-use certifications:

- I do not sell or transfer user data to third parties, apart from the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Test instructions

```
No account and no password are required.

1. Open any https page and click the Felt Tip toolbar button.
2. Draw a stroke with the pen, then close the panel.
3. Reload the page. The stroke is still there.
4. Open the same address in a new tab. The stroke is there with the tools closed.
```
