import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_TOOL,
  dropExpired,
  isPageFresh,
  lifetimeMs,
  normalizeLifetime,
  normalizeToolPrefs,
  pageKey,
  pageRecord,
  prunePages,
} from "../src/lib/storage.js";

test("tool prefs fall back and clamp the same way as the still editor", () => {
  assert.equal(normalizeToolPrefs(null).strokeWidth, DEFAULT_TOOL.strokeWidth);
  assert.equal(normalizeToolPrefs(null).highlightOpacity, 40);
  assert.equal(normalizeToolPrefs(null).textBgOpacity, 0);
  const prefs = normalizeToolPrefs({
    strokeOpacity: -20,
    shapeOpacity: 140,
    highlightOpacity: 0,
    blurRadius: 1,
    stepStart: 0,
    fontSize: 999,
    textBg: "blue",
  });
  assert.equal(prefs.strokeOpacity, 0);
  assert.equal(prefs.shapeOpacity, 100);
  assert.equal(prefs.highlightOpacity, 0);
  assert.equal(prefs.blurRadius, 2);
  assert.equal(prefs.stepStart, 1);
  assert.equal(prefs.fontSize, 240);
  assert.equal(prefs.textBg, "#ffffff");
});

test("a page key ignores the hash and rejects non-pages", () => {
  assert.equal(pageKey("https://example.com/a/b?x=1#mark"), "https://example.com/a/b?x=1");
  assert.equal(pageKey("http://localhost:3000/"), "http://localhost:3000/");
  assert.equal(pageKey("file:///tmp/page.html"), "null/tmp/page.html");
  assert.equal(pageKey("chrome://newtab/"), "");
  assert.equal(pageKey("not a url"), "");
});

test("a lifetime keeps fresh marks and drops expired ones", () => {
  assert.equal(normalizeLifetime("nope"), "forever");
  assert.equal(lifetimeMs("forever"), 0);
  assert.equal(lifetimeMs("1mo"), 30 * 24 * 60 * 60 * 1000);
  const now = Date.UTC(2026, 9, 28, 12, 0, 0);
  const fresh = { annotations: [{ type: "pen" }], updatedAt: now - 29 * 60 * 1000 };
  const old = { annotations: [{ type: "pen" }], updatedAt: now - 30 * 60 * 1000 };
  const pages = { fresh, old, ancient: { annotations: [{ type: "text" }], updatedAt: now - 40 * 24 * 60 * 60 * 1000 } };
  assert.equal(isPageFresh(fresh, "30m", now), true);
  assert.equal(isPageFresh(old, "30m", now), false);
  assert.equal(isPageFresh(old, "forever", now), true);
  const kept = dropExpired(pages, "30m", now);
  assert.deepEqual(Object.keys(kept), ["fresh"]);
  assert.equal(pageRecord(pages, "fresh", "30m", now), fresh);
  assert.equal(pageRecord(pages, "old", "30m", now), null);
  assert.equal(pageRecord(pages, "ancient", "1mo", now), null);
  assert.equal(pageRecord(pages, "ancient", "forever", now)?.annotations.length, 1);
  assert.equal(dropExpired(pages, "forever", now), pages);
});

test("page storage keeps the newest hundred records", () => {
  const pages = {};
  for (let index = 0; index < 105; index += 1) {
    pages[`https://example.com/${index}`] = { annotations: [], updatedAt: index };
  }
  pages.bad = { updatedAt: 999 };
  const pruned = prunePages(pages);
  assert.equal(Object.keys(pruned).length, 100);
  assert.equal(pruned["https://example.com/0"], undefined);
  assert.ok(pruned["https://example.com/104"]);
  assert.equal(pruned.bad, undefined);
});
