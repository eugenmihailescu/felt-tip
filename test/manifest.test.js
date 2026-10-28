import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { pageAllowsScripting } from "../src/lib/pages.js";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));

test("manifest can draw saved marks on a page before the tools are opened", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.name, "Felt Tip");
  assert.equal(manifest.minimum_chrome_version, "116");
  assert.deepEqual(
    [...manifest.permissions].sort(),
    ["activeTab", "scripting", "storage"],
  );
  assert.deepEqual(
    [...manifest.host_permissions].sort(),
    ["file:///*", "http://*/*", "https://*/*"],
  );
  assert.deepEqual(manifest.content_scripts, [
    {
      matches: ["http://*/*", "https://*/*", "file:///*"],
      js: ["src/page/history-hook.js"],
      world: "MAIN",
      run_at: "document_start",
      all_frames: false,
    },
    {
      matches: ["http://*/*", "https://*/*", "file:///*"],
      js: ["src/page/restore.js"],
      run_at: "document_start",
      all_frames: false,
    },
  ]);
  assert.equal(manifest.action.default_popup, undefined);
  assert.equal(manifest.background.service_worker, "src/background/service-worker.js");
  assert.equal(manifest.background.type, "module");
  assert.deepEqual(
    [...manifest.web_accessible_resources[0].resources].sort(),
    ["src/lib/annotations.js", "src/lib/geometry.js", "src/lib/storage.js"],
  );
});

test("scripting is limited to web and file pages", () => {
  assert.equal(pageAllowsScripting("https://example.com/path"), true);
  assert.equal(pageAllowsScripting("http://localhost:3000/"), true);
  assert.equal(pageAllowsScripting("file:///tmp/page.html"), true);
  assert.equal(pageAllowsScripting("brave://extensions"), false);
  assert.equal(pageAllowsScripting("chrome://newtab/"), false);
  assert.equal(pageAllowsScripting("chrome-extension://abc/page.html"), false);
  assert.equal(pageAllowsScripting(""), false);
});
