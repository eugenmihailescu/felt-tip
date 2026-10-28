import assert from "node:assert/strict";
import test from "node:test";
import {
  annotationBounds,
  annotationContains,
  clampStepStart,
  cssFontFamily,
  hitAnnotation,
  nextStepNumber,
  normalizeAnnotations,
  paintSteps,
  renumberSteps,
  strokeAlpha,
  strokeOpacity,
  textBackgroundColor,
  textBounds,
  translateAnnotation,
} from "../src/lib/annotations.js";

const rect = { type: "rect", x: 10, y: 20, w: 40, h: 30, width: 4 };
const pen = { type: "pen", width: 4, points: [{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 50, y: 40 }] };
const arrow = { type: "arrow", x1: 0, y1: 0, x2: 100, y2: 0, width: 4 };
const marker = (n, x = n * 10) => ({ type: "step", x, y: 40, n, size: 36, fill: "#e23b2f", color: "#ffffff" });

test("missing stroke opacity stays solid, and a highlight stays at 40 percent", () => {
  assert.equal(strokeOpacity({ type: "rect" }), 100);
  assert.equal(strokeAlpha({ type: "rect" }), 1);
  assert.equal(strokeOpacity({ type: "highlight" }), 40);
  assert.equal(strokeAlpha({ type: "highlight" }), 0.4);
});

test("stroke opacity is clamped to the 0–100 range", () => {
  assert.equal(strokeOpacity({ type: "pen", opacity: 25 }), 25);
  assert.equal(strokeAlpha({ type: "ellipse", opacity: 25 }), 0.25);
  assert.equal(strokeOpacity({ type: "arrow", opacity: 180 }), 100);
  assert.equal(strokeOpacity({ type: "highlight", opacity: -4 }), 0);
  assert.equal(strokeAlpha({ type: "rect", opacity: 0 }), 0);
});

test("a spaced font name is quoted for canvas and css", () => {
  assert.equal(cssFontFamily("Times New Roman"), '"Times New Roman"');
  assert.equal(cssFontFamily("monospace"), "monospace");
  assert.equal(cssFontFamily(""), "Arial");
  const bounds = textBounds(null, { x: 1, y: 2, text: "Hi", size: 10, font: "Times New Roman" });
  assert.equal(bounds.w, Math.max(8, "Hi".length * 10 * 0.5 + 8));
  assert.equal(bounds.h, 10 * 1.3 + 4);
});

test("text background is transparent at zero opacity", () => {
  assert.equal(textBackgroundColor({ bg: "#000000", bgOpacity: 0 }), "");
  assert.equal(textBackgroundColor({ bg: "#000000", bgOpacity: 40 }), "rgba(0, 0, 0, 0.4)");
  assert.equal(textBackgroundColor({ bg: "transparent", bgOpacity: 50 }), "rgba(255, 255, 255, 0.5)");
  assert.equal(textBackgroundColor({ bg: "#112233" }), "#112233");
});

test("hits the topmost drawing under the pointer", () => {
  assert.equal(annotationContains(null, rect, { x: 20, y: 30 }), true);
  assert.equal(annotationContains(null, rect, { x: 200, y: 30 }), false);
  assert.equal(annotationContains(null, pen, { x: 50, y: 20 }), true);
  assert.equal(annotationContains(null, pen, { x: 10, y: 30 }), false);
  assert.equal(annotationContains(null, arrow, { x: 50, y: 2 }), true);
  assert.equal(annotationContains(null, arrow, { x: 50, y: 40 }), false);
  assert.equal(annotationContains(null, { type: "ellipse", x: 0, y: 0, w: 100, h: 40, width: 4 }, { x: 50, y: 20 }), true);
  assert.equal(annotationContains(null, { type: "ellipse", x: 0, y: 0, w: 100, h: 40, width: 4 }, { x: 0, y: 0 }), false);
  const stacked = [rect, { ...rect, x: 30 }];
  assert.equal(hitAnnotation(null, stacked, { x: 45, y: 30 }), 1);
});

test("moves every point of a drawing by the same amount", () => {
  const movedPen = translateAnnotation(pen, 5, -3);
  assert.deepEqual(movedPen.points, [{ x: 5, y: -3 }, { x: 55, y: -3 }, { x: 55, y: 37 }]);
  assert.deepEqual(pen.points[0], { x: 0, y: 0 });
  const movedArrow = translateAnnotation(arrow, 8, 2);
  assert.equal(movedArrow.x1, 8);
  assert.equal(movedArrow.y2, 2);
  const movedText = translateAnnotation({ type: "text", x: 4, y: 6, text: "Hi" }, 1, 1);
  assert.deepEqual({ x: movedText.x, y: movedText.y }, { x: 5, y: 7 });
});

test("a blur zone is hit inside its box and moves with the page", () => {
  const blur = { type: "blur", x: 10, y: 10, w: 40, h: 20, radius: 8 };
  assert.equal(annotationContains(null, blur, { x: 10, y: 10 }), true);
  assert.equal(annotationContains(null, blur, { x: 9, y: 10 }), false);
  const moved = translateAnnotation(blur, 3, 4);
  assert.deepEqual({ x: moved.x, y: moved.y, radius: moved.radius }, { x: 13, y: 14, radius: 8 });
});

test("the next step number continues the sequence or uses the start", () => {
  assert.equal(nextStepNumber([], 5), 5);
  assert.equal(nextStepNumber([{ type: "rect", x: 0, y: 0 }], 3), 3);
  assert.equal(nextStepNumber([marker(5), marker(6)], 1), 7);
  assert.equal(nextStepNumber([marker(2)], 9), 3);
  assert.equal(clampStepStart("nope"), 1);
  assert.equal(clampStepStart(0), 1);
  assert.equal(clampStepStart(4.6), 5);
  assert.equal(clampStepStart(10000), 9999);
});

test("deleting a step closes the gap and keeps a custom start", () => {
  const mixed = [marker(1, 1), { type: "rect", x: 0, y: 0, w: 4, h: 4 }, marker(2, 2), marker(3, 3)];
  const withoutFirst = renumberSteps(mixed.filter((item) => item.n !== 1), 1);
  assert.deepEqual(withoutFirst.map((item) => (item.type === "step" ? item.n : item.type)), ["rect", 1, 2]);
  assert.equal(mixed[2].n, 2);

  const custom = [marker(5), marker(6), marker(7)];
  assert.deepEqual(renumberSteps(custom.filter((_, index) => index !== 0), 5).map((item) => item.n), [5, 6]);

  const tied = [{ type: "step", n: 4, id: "a" }, { type: "step", n: 4, id: "b" }];
  assert.deepEqual(renumberSteps(tied, 1).map((item) => [item.id, item.n]), [["a", 1], ["b", 2]]);
});

test("style changes touch every step and leave other drawings alone", () => {
  const mixed = [marker(1), { type: "rect", fill: "#111111" }];
  const painted = paintSteps(mixed, { fill: "#1f6feb", color: "#111111", size: 52 });
  assert.equal(painted[0].fill, "#1f6feb");
  assert.equal(painted[0].size, 52);
  assert.equal(painted[0].n, 1);
  assert.equal(painted[1].fill, "#111111");
  assert.equal(mixed[0].fill, "#e23b2f");
});

test("a step is hit inside its circle and moves from its center", () => {
  const step = marker(1, 100);
  assert.equal(annotationContains(null, step, { x: 100, y: 40 }), true);
  assert.equal(annotationContains(null, step, { x: 122, y: 40 }), true);
  assert.equal(annotationContains(null, step, { x: 123, y: 40 }), false);
  assert.deepEqual(annotationBounds(null, step), { x: 82, y: 22, w: 36, h: 36 });
  const moved = translateAnnotation(step, 5, -4);
  assert.deepEqual({ x: moved.x, y: moved.y, n: moved.n }, { x: 105, y: 36, n: 1 });
  assert.equal(step.x, 100);
});

test("stored marks keep known types and drop anything else", () => {
  const marks = normalizeAnnotations([
    { type: "pen", points: [] },
    { type: "crop", x: 1 },
    null,
    { type: "blur", x: 0, y: 0, w: 1, h: 1, radius: 8 },
  ]);
  assert.deepEqual(marks.map((item) => item.type), ["pen", "blur"]);
  assert.deepEqual(normalizeAnnotations(null), []);
});
