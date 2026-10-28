export function arrowHead(x1, y1, x2, y2, strokeWidth) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const length = Math.max(10, strokeWidth * 4);
  const spread = Math.PI / 7;
  return [
    { x: x2, y: y2 },
    { x: x2 - length * Math.cos(angle - spread), y: y2 - length * Math.sin(angle - spread) },
    { x: x2 - length * Math.cos(angle + spread), y: y2 - length * Math.sin(angle + spread) },
  ];
}

// The shaft stops short of the tip so the filled head is not crossed by the line.
export function arrowShaftEnd(x1, y1, x2, y2, strokeWidth) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const shorten = Math.max(8, strokeWidth * 3) * 0.45;
  return {
    x: x2 - Math.cos(angle) * shorten,
    y: y2 - Math.sin(angle) * shorten,
  };
}

export function normalizeRect(x1, y1, x2, y2) {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  return { x, y, w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) };
}

export function distanceToSegment(point, start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = dx * dx + dy * dy;
  if (length === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / length));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

export function pointInTriangle(point, a, b, c) {
  const sign = (p, q, r) => (p.x - r.x) * (q.y - r.y) - (q.x - r.x) * (p.y - r.y);
  const ab = sign(point, a, b);
  const bc = sign(point, b, c);
  const ca = sign(point, c, a);
  return !((ab < 0 || bc < 0 || ca < 0) && (ab > 0 || bc > 0 || ca > 0));
}
