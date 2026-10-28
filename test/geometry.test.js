import assert from "node:assert/strict";
import test from "node:test";
import { arrowHead, arrowShaftEnd, normalizeRect } from "../src/lib/geometry.js";

test("a rectangle drag normalizes to a positive box", () => {
  assert.deepEqual(normalizeRect(10, 30, 4, 8), { x: 4, y: 8, w: 6, h: 22 });
});

test("an arrow head sits on the end and the shaft stops short of it", () => {
  const head = arrowHead(0, 0, 100, 0, 4);
  assert.deepEqual(head[0], { x: 100, y: 0 });
  assert.ok(head[1].x < 100);
  assert.ok(head[2].y < 0);
  const end = arrowShaftEnd(0, 0, 100, 0, 4);
  assert.ok(end.x < 100);
  assert.ok(end.x > head[1].x);
  assert.equal(end.y, 0);
});
