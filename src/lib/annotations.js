import { arrowHead, arrowShaftEnd, distanceToSegment, normalizeRect, pointInTriangle } from "./geometry.js";

export { arrowHead, arrowShaftEnd, normalizeRect };

export const FONTS = ["Arial", "Verdana", "Georgia", "Times New Roman", "Courier New", "monospace"];

export const STROKE_COLORS = [
  ["Red", "#e23b2f"],
  ["Orange", "#f0883e"],
  ["Yellow", "#f5c518"],
  ["Green", "#2da44e"],
  ["Blue", "#1f6feb"],
  ["Black", "#111111"],
  ["White", "#ffffff"],
];

export const TEXT_COLORS = [
  ["Black", "#111111"],
  ["White", "#ffffff"],
  ["Red", "#e23b2f"],
  ["Blue", "#1f6feb"],
  ["Green", "#2da44e"],
  ["Orange", "#f0883e"],
  ["Purple", "#8250df"],
];

export const HIGHLIGHT_COLORS = [
  ["Yellow", "#ffe14a"],
  ["Green", "#b6ef4a"],
  ["Pink", "#ff8ad4"],
  ["Orange", "#ffc14a"],
  ["Blue", "#8ecbff"],
];

export const STEP_TEXT_COLORS = [
  ["White", "#ffffff"],
  ["Black", "#111111"],
  ["Red", "#e23b2f"],
  ["Blue", "#1f6feb"],
  ["Green", "#2da44e"],
];

export const STEP_SIZES = [
  ["Small", 24],
  ["Medium", 36],
  ["Large", 52],
];

export const MARK_TYPES = ["pen", "highlight", "rect", "ellipse", "arrow", "text", "step", "blur"];

export function strokeOpacity(annotation) {
  const fallback = annotation?.type === "highlight" ? 40 : 100;
  if (annotation?.opacity == null) return fallback;
  const opacity = Math.round(Number(annotation.opacity));
  if (!Number.isFinite(opacity)) return fallback;
  return Math.min(100, Math.max(0, opacity));
}

export function strokeAlpha(annotation) {
  return strokeOpacity(annotation) / 100;
}

export function clampStepStart(start) {
  const number = Math.round(Number(start));
  if (!Number.isFinite(number)) return 1;
  return Math.min(9999, Math.max(1, number));
}

export function stepRadius(annotation) {
  const size = Number(annotation?.size);
  return Math.max(8, Number.isFinite(size) ? size : 36) / 2;
}

export function nextStepNumber(annotations, start = 1) {
  let max = null;
  for (const item of annotations || []) {
    if (item?.type === "step" && Number.isFinite(item.n)) max = max == null ? item.n : Math.max(max, item.n);
  }
  return max == null ? clampStepStart(start) : max + 1;
}

export function renumberSteps(annotations, start = 1) {
  const origin = clampStepStart(start);
  const order = [];
  annotations.forEach((item, index) => {
    if (item?.type === "step") order.push(index);
  });
  order.sort((a, b) => (annotations[a].n ?? 0) - (annotations[b].n ?? 0) || a - b);
  const numbers = new Map(order.map((index, place) => [index, origin + place]));
  return annotations.map((item, index) => (numbers.has(index) ? { ...item, n: numbers.get(index) } : item));
}

export function paintSteps(annotations, patch) {
  return annotations.map((item) => (item?.type === "step" ? { ...item, ...patch } : item));
}

export function textBackgroundColor(annotation) {
  if (annotation.bgOpacity == null) {
    return annotation.bg && annotation.bg !== "transparent" ? annotation.bg : "";
  }
  const opacity = Math.round(Number(annotation.bgOpacity));
  if (!Number.isFinite(opacity) || opacity <= 0) return "";
  const match = /^#([0-9a-fA-F]{6})$/.exec(annotation.bg || "");
  const hex = match ? match[1] : "ffffff";
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${Math.min(opacity, 100) / 100})`;
}

export function cssFontFamily(font) {
  const name = String(font || "Arial").replaceAll('"', "");
  if (!name) return "Arial";
  return /\s/.test(name) ? `"${name}"` : name;
}

export function textBounds(context, annotation) {
  const size = Number(annotation.size) || 28;
  let measured = String(annotation.text || "").length * size * 0.5;
  if (context?.measureText) {
    context.save?.();
    context.font = `${size}px ${cssFontFamily(annotation.font)}`;
    measured = context.measureText(annotation.text || "").width;
    context.restore?.();
  }
  return {
    x: annotation.x,
    y: annotation.y,
    w: Math.max(8, measured + 8),
    h: size * 1.3 + 4,
  };
}

export function translateAnnotation(annotation, dx, dy) {
  if (!dx && !dy) return annotation;
  if (annotation.points) {
    return {
      ...annotation,
      points: annotation.points.map((point) => ({ x: point.x + dx, y: point.y + dy })),
    };
  }
  if (annotation.type === "arrow") {
    return {
      ...annotation,
      x1: annotation.x1 + dx,
      y1: annotation.y1 + dy,
      x2: annotation.x2 + dx,
      y2: annotation.y2 + dy,
    };
  }
  if (annotation.x != null && annotation.y != null) {
    return { ...annotation, x: annotation.x + dx, y: annotation.y + dy };
  }
  return annotation;
}

export function hitAnnotation(context, annotations, point) {
  for (let index = annotations.length - 1; index >= 0; index -= 1) {
    if (annotationContains(context, annotations[index], point)) return index;
  }
  return -1;
}

export function annotationContains(context, annotation, point) {
  const pad = Math.max(6, (annotation.width || 0) / 2 + 4);
  if (annotation.type === "pen" || annotation.type === "highlight") {
    const points = annotation.points || [];
    for (let index = 0; index < points.length; index += 1) {
      const next = points[Math.min(index + 1, points.length - 1)];
      if (distanceToSegment(point, points[index], next) <= pad) return true;
    }
    return false;
  }
  if (annotation.type === "rect" || annotation.type === "blur") {
    const extra = annotation.type === "blur" ? 0 : pad;
    return point.x >= annotation.x - extra
      && point.y >= annotation.y - extra
      && point.x <= annotation.x + annotation.w + extra
      && point.y <= annotation.y + annotation.h + extra;
  }
  if (annotation.type === "ellipse") {
    const rx = Math.max(1, Math.abs(annotation.w) / 2 + pad);
    const ry = Math.max(1, Math.abs(annotation.h) / 2 + pad);
    const nx = (point.x - (annotation.x + annotation.w / 2)) / rx;
    const ny = (point.y - (annotation.y + annotation.h / 2)) / ry;
    return nx * nx + ny * ny <= 1;
  }
  if (annotation.type === "arrow") {
    const start = { x: annotation.x1, y: annotation.y1 };
    const end = { x: annotation.x2, y: annotation.y2 };
    if (distanceToSegment(point, start, end) <= pad) return true;
    const head = arrowHead(annotation.x1, annotation.y1, annotation.x2, annotation.y2, annotation.width || 4);
    return pointInTriangle(point, head[0], head[1], head[2]);
  }
  if (annotation.type === "text") {
    const bounds = textBounds(context, annotation);
    return point.x >= bounds.x && point.y >= bounds.y
      && point.x <= bounds.x + bounds.w && point.y <= bounds.y + bounds.h;
  }
  if (annotation.type === "step") {
    return Math.hypot(point.x - annotation.x, point.y - annotation.y) <= stepRadius(annotation) + 4;
  }
  return false;
}

export function annotationBounds(context, annotation) {
  if (annotation.type === "text") return textBounds(context, annotation);
  if (annotation.type === "step") {
    const radius = stepRadius(annotation);
    return { x: annotation.x - radius, y: annotation.y - radius, w: radius * 2, h: radius * 2 };
  }
  if (annotation.points?.length) {
    const pad = (annotation.width || 0) / 2;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const point of annotation.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    return { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 };
  }
  if (annotation.type === "arrow") {
    const head = arrowHead(annotation.x1, annotation.y1, annotation.x2, annotation.y2, annotation.width || 4);
    const xs = [annotation.x1, annotation.x2, ...head.map((point) => point.x)];
    const ys = [annotation.y1, annotation.y2, ...head.map((point) => point.y)];
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    return { x: minX, y: minY, w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
  }
  if (annotation.w != null && annotation.h != null) {
    return { x: annotation.x, y: annotation.y, w: annotation.w, h: annotation.h };
  }
  return null;
}

export function normalizeAnnotations(list) {
  if (!Array.isArray(list)) return [];
  const marks = [];
  for (const item of list) {
    if (!item || typeof item !== "object" || !MARK_TYPES.includes(item.type)) continue;
    marks.push(item);
  }
  return marks;
}
