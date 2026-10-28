import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("..", import.meta.url);
const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));

test("manifest pages and icons exist", () => {
  const paths = [
    manifest.background.service_worker,
    "src/message/message.html",
    "src/message/message.js",
    "src/page/annotate.js",
    "src/page/restore.js",
    "src/page/history-hook.js",
    "src/lib/annotations.js",
    "src/lib/geometry.js",
    "src/lib/pages.js",
    "src/lib/storage.js",
    ...Object.values(manifest.icons),
  ];
  for (const path of paths) {
    assert.equal(existsSync(new URL(path, root)), true, path);
  }
});

test("page scripts stay classic and load modules with a call", () => {
  for (const path of ["../src/page/annotate.js", "../src/page/restore.js"]) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.equal(/\bexport\b|\bimport[\s"']/.test(source), false, path);
    assert.equal(source.includes("import("), true, path);
  }
  const hook = readFileSync(new URL("../src/page/history-hook.js", import.meta.url), "utf8");
  assert.equal(/\bexport\b|\bimport[\s"']/.test(hook), false);
  assert.equal(hook.includes("pushState"), true);
});
