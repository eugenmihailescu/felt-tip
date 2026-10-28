export const PAGE_LIMIT = 100;

// A month is 30 days. Forever is 0 and does not expire.
export const LIFETIMES = [
  { id: "30m", label: "30 min", ms: 30 * 60 * 1000 },
  { id: "1h", label: "1 hour", ms: 60 * 60 * 1000 },
  { id: "12h", label: "12 hours", ms: 12 * 60 * 60 * 1000 },
  { id: "1d", label: "1 day", ms: 24 * 60 * 60 * 1000 },
  { id: "1w", label: "1 week", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "1mo", label: "1 month", ms: 30 * 24 * 60 * 60 * 1000 },
  { id: "forever", label: "Forever", ms: 0 },
];

export const DEFAULT_TOOL = {
  color: "#e23b2f",
  strokeWidth: 4,
  strokeOpacity: 100,
  highlightColor: "#ffe14a",
  highlightWidth: 18,
  highlightOpacity: 40,
  shapeColor: "#e23b2f",
  shapeWidth: 4,
  shapeOpacity: 100,
  font: "Arial",
  fontSize: 28,
  textColor: "#111111",
  textBg: "#ffffff",
  textBgOpacity: 0,
  textShadow: false,
  shadowBlur: 8,
  blurRadius: 8,
  stepFill: "#e23b2f",
  stepColor: "#ffffff",
  stepSize: 36,
  stepStart: 1,
};

function clampInt(value, min, max, fallback) {
  const number = Math.round(Number(value));
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

export function normalizeToolPrefs(raw) {
  const tool = { ...DEFAULT_TOOL, ...(raw && typeof raw === "object" ? raw : {}) };
  return {
    color: tool.color || DEFAULT_TOOL.color,
    strokeWidth: clampInt(tool.strokeWidth, 1, 64, DEFAULT_TOOL.strokeWidth),
    strokeOpacity: clampInt(tool.strokeOpacity, 0, 100, DEFAULT_TOOL.strokeOpacity),
    highlightColor: tool.highlightColor || DEFAULT_TOOL.highlightColor,
    highlightWidth: clampInt(tool.highlightWidth, 1, 80, DEFAULT_TOOL.highlightWidth),
    highlightOpacity: clampInt(tool.highlightOpacity, 0, 100, DEFAULT_TOOL.highlightOpacity),
    shapeColor: tool.shapeColor || DEFAULT_TOOL.shapeColor,
    shapeWidth: clampInt(tool.shapeWidth, 1, 64, DEFAULT_TOOL.shapeWidth),
    shapeOpacity: clampInt(tool.shapeOpacity, 0, 100, DEFAULT_TOOL.shapeOpacity),
    font: tool.font || DEFAULT_TOOL.font,
    fontSize: clampInt(tool.fontSize, 8, 240, DEFAULT_TOOL.fontSize),
    textColor: tool.textColor || DEFAULT_TOOL.textColor,
    textBg: /^#[0-9a-fA-F]{6}$/.test(tool.textBg) ? tool.textBg : "#ffffff",
    textBgOpacity: clampInt(tool.textBgOpacity, 0, 100, 0),
    textShadow: tool.textShadow === true,
    shadowBlur: clampInt(tool.shadowBlur, 0, 40, DEFAULT_TOOL.shadowBlur),
    blurRadius: clampInt(tool.blurRadius, 2, 40, DEFAULT_TOOL.blurRadius),
    stepFill: tool.stepFill || DEFAULT_TOOL.stepFill,
    stepColor: tool.stepColor || DEFAULT_TOOL.stepColor,
    stepSize: clampInt(tool.stepSize, 16, 96, DEFAULT_TOOL.stepSize),
    stepStart: clampInt(tool.stepStart, 1, 9999, DEFAULT_TOOL.stepStart),
  };
}

export function pageKey(url) {
  try {
    const parsed = new URL(url);
    if (!/^(https?:|file:)$/i.test(parsed.protocol)) return "";
    return `${parsed.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return "";
  }
}

export function normalizeLifetime(value) {
  return LIFETIMES.some((option) => option.id === value) ? value : "forever";
}

export function lifetimeMs(value) {
  const id = normalizeLifetime(value);
  return LIFETIMES.find((option) => option.id === id).ms;
}

export function isPageFresh(entry, lifetime, now = Date.now()) {
  const span = lifetimeMs(lifetime);
  if (!span) return true;
  const updated = Number(entry?.updatedAt);
  if (!Number.isFinite(updated)) return false;
  return now - updated < span;
}

export function dropExpired(pages, lifetime, now = Date.now()) {
  const source = pages && typeof pages === "object" ? pages : {};
  if (!lifetimeMs(lifetime)) return source;
  return Object.fromEntries(Object.entries(source).filter(([, value]) => isPageFresh(value, lifetime, now)));
}

export function pageRecord(pages, key, lifetime, now = Date.now()) {
  const entry = pages?.[key];
  if (!entry || !Array.isArray(entry.annotations) || entry.annotations.length === 0) return null;
  if (!isPageFresh(entry, lifetime, now)) return null;
  return entry;
}

export function prunePages(pages, limit = PAGE_LIMIT) {
  const entries = Object.entries(pages && typeof pages === "object" ? pages : {})
    .filter(([, value]) => value && Array.isArray(value.annotations));
  entries.sort((a, b) => (Number(b[1].updatedAt) || 0) - (Number(a[1].updatedAt) || 0) || (a[0] < b[0] ? 1 : -1));
  return Object.fromEntries(entries.slice(0, Math.max(0, limit)));
}

function emptyState() {
  return { tool: normalizeToolPrefs(null), pages: {}, lifetime: "forever" };
}

export function loadState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["tool", "pages", "lifetime"], (stored) => {
      if (chrome.runtime.lastError || !stored || typeof stored !== "object") {
        resolve(emptyState());
        return;
      }
      const tool = normalizeToolPrefs(stored.tool);
      const lifetime = normalizeLifetime(stored.lifetime);
      const raw = stored.pages && typeof stored.pages === "object" ? stored.pages : {};
      const living = dropExpired(raw, lifetime);
      const pages = prunePages(living);
      const removed = Object.keys(raw).some((key) => living[key] === undefined);
      if (removed) {
        chrome.storage.local.set({ tool, pages, lifetime }, () => {
          void chrome.runtime.lastError;
        });
      }
      resolve({ tool, pages, lifetime });
    });
  });
}

export function saveState(state) {
  const tool = normalizeToolPrefs(state?.tool);
  const lifetime = normalizeLifetime(state?.lifetime);
  const pages = prunePages(dropExpired(state?.pages, lifetime));
  return new Promise((resolve) => {
    chrome.storage.local.set({ tool, pages, lifetime }, () => {
      void chrome.runtime.lastError;
      resolve({ tool, pages, lifetime });
    });
  });
}
