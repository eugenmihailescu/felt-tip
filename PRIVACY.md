# Privacy policy for Felt Tip

Last updated: 29 October 2026

Felt Tip is a browser extension by Eugen Mihailescu. It draws marks on a web page and keeps those marks on that page. This policy says what the extension stores, why, and who can see it.

Contact: [eugen.mihailescu@protonmail.com](mailto:eugen.mihailescu@protonmail.com)

## What Felt Tip stores

Felt Tip stores data only in `chrome.storage.local` on your browser profile. It does not create an account. It does not send this data to Eugen Mihailescu or to any other server.

After you put a mark on a page, Felt Tip stores:

- The page address, as the origin, path, and query. The hash is not stored. An address is stored only for a page you have marked. Felt Tip keeps the newest 100 addresses.
- The marks on that page: pen strokes, highlights, rectangles, ellipses, arrows, numbered steps, blur zones, and text you type into a mark. A mark includes its position, size, and appearance.
- When those marks were last changed, so the lifetime you chose can be applied.
- Your tool settings, such as color, width, opacity, font, and blur radius.
- How long marks should stay: 30 minutes, 1 hour, 12 hours, 1 day, 1 week, 1 month (30 days), or forever.

Felt Tip does not read the text of the page, take a screenshot, or record the screen. It does not log your clicks, mouse movement, scrolling, or keystrokes. It does not collect your name, email address, health information, payment information, location, or sign-in information.

## Why this data is stored

The address is stored so those marks can be drawn again when that page loads, including in another tab and when the site changes to that address without reloading. The marks and tool settings are stored so your drawing and your choices come back. The lifetime is stored so marks older than the choice you picked can be removed.

## How long it is kept

Marks remain until they are older than the lifetime you chose, until you use **Clear marks on this page**, or until a newer address replaces them after the 100-address limit. Forever means the marks do not expire by age. Clearing the marks on a page removes that page's saved marks and its address. Your tool settings and lifetime choice remain. Removing Felt Tip from the browser deletes the extension's stored data.

## Who can see it

The data stays in this browser profile. Felt Tip does not sell it, upload it, or share it with anyone. There are no advertisements and no analytics.

## Permissions

- `activeTab` and `scripting` open the tools on the tab whose toolbar button you clicked, and draw saved marks on a page that already has them.
- `storage` keeps the marks and settings on this browser profile.
- Access to `http`, `https`, and `file` pages lets saved marks come back on a page where you have not opened the tools. On a file page, the browser also asks you to turn on **Allow access to file URLs**.

One small script runs in the page's own JavaScript world so Felt Tip can notice when the site changes the address without reloading. That script does not read the page's contents.

## Limited use

Felt Tip uses this data only for its single purpose: drawing marks on the page you are reading and showing those saved marks again when that page is opened. The use of information received from Chrome extension APIs adheres to the [Chrome Web Store User Data Policy](https://developer.chrome.com/docs/webstore/program-policies/user-data), including the Limited Use requirements.

## Changes

Changes to this policy will be posted in this document with a new date.
