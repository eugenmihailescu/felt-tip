import assert from "node:assert/strict";
import test from "node:test";
import { pageAllowsScripting } from "../src/lib/pages.js";

test("scripting is limited to web and file pages", () => {
  assert.equal(pageAllowsScripting("https://example.com/path"), true);
  assert.equal(pageAllowsScripting("http://localhost:3000/"), true);
  assert.equal(pageAllowsScripting("file:///tmp/page.html"), true);
  assert.equal(pageAllowsScripting("brave://extensions"), false);
  assert.equal(pageAllowsScripting("chrome://newtab/"), false);
  assert.equal(pageAllowsScripting("chrome-extension://abc/page.html"), false);
  assert.equal(pageAllowsScripting(""), false);
});
