(() => {
  if (globalThis.__feltTipActive) {
    globalThis.__feltTipRestore = false;
    globalThis.__feltTipToggle?.();
    return;
  }
  const restoreOnly = globalThis.__feltTipRestore === true;
  globalThis.__feltTipRestore = false;
  globalThis.__feltTipActive = true;
  document.querySelectorAll("#felt-tip").forEach((node) => node.remove());
  document.documentElement.dataset.feltTipWatch = "1";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const SELECT_CLICK_PX = 6;
  const HISTORY_LIMIT = 50;
  const SHAPE_TOOLS = ["pen", "highlight", "rect", "ellipse", "arrow"];
  const TOOLS = [
    ["pen", "Pen"],
    ["highlight", "Highlight"],
    ["rect", "Rectangle"],
    ["ellipse", "Ellipse"],
    ["arrow", "Arrow"],
    ["text", "Text"],
    ["step", "Step"],
    ["blur", "Blur"],
    ["move", "Move"],
    ["erase", "Erase"],
  ];
  const ICONS = {
    undo: `<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H12"/>`,
    redo: `<path d="m15 14 5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H12"/>`,
    move: `<path d="M12 4.5v15"/><path d="M4.5 12h15"/><path d="m9 7.5 3-3 3 3"/><path d="m9 16.5 3 3 3-3"/><path d="m7.5 9-3 3 3 3"/><path d="m16.5 9 3 3-3 3"/>`,
    pen: `<path d="M13 20.5h8"/><path d="m16.4 3.8 3.8 3.8L8.2 19.6 4 20.5l.9-4.2Z"/>`,
    highlight: `<rect x="3" y="9.2" width="18" height="5.6" rx="1.4" fill="currentColor" stroke="none" opacity="0.45"/><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h11"/>`,
    rect: `<rect x="4.5" y="6.5" width="15" height="11" rx="1.5"/>`,
    ellipse: `<ellipse cx="12" cy="12" rx="7.5" ry="5.5"/>`,
    arrow: `<path d="M5 19 19 5"/><path d="M9.5 5H19v9.5"/>`,
    text: `<path d="M5 5.5h14"/><path d="M12 5.5V19"/>`,
    step: `<circle cx="12" cy="12" r="7.25"/><text x="12" y="12.5" fill="currentColor" stroke="none" font-size="11" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle" dominant-baseline="central">1</text>`,
    erase: `<path d="M13.2 5.2 19 11l-7.2 7.2H7.2L4 15.2Z"/><path d="M8.4 9.4 11.6 12.6"/><path d="M3.2 20.6h12"/>`,
    blur: `<circle cx="12" cy="12" r="2.3" fill="currentColor" stroke="none"/><circle cx="12" cy="4.8" r="1.35" fill="currentColor" stroke="none"/><circle cx="12" cy="19.2" r="1.35" fill="currentColor" stroke="none"/><circle cx="4.8" cy="12" r="1.35" fill="currentColor" stroke="none"/><circle cx="19.2" cy="12" r="1.35" fill="currentColor" stroke="none"/>`,
    close: `<path d="M6 6l12 12M18 6 6 18"/>`,
    clear: `<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M7 7l1 13h8l1-13"/><path d="M10 11v6"/><path d="M14 11v6"/>`,
  };

  const host = document.createElement("div");
  host.id = "felt-tip";
  host.style.cssText = "all:initial;position:absolute;left:0;top:0;width:0;height:0;overflow:visible;z-index:2147483647;pointer-events:none;";
  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host {
        all: initial;
        --ft-text: #1b1f24;
        --ft-muted: #57606a;
        --ft-bg: #ffffff;
        --ft-field: #f6f8fa;
        --ft-line: rgba(0,0,0,.22);
        --ft-edge: rgba(0,0,0,.12);
        --ft-shadow: 0 8px 28px rgba(0,0,0,.16);
        --ft-accent: #1f6feb;
      }
      @media (prefers-color-scheme: dark) {
        :host {
          --ft-text: #ffffff;
          --ft-muted: #c9d1d9;
          --ft-bg: #1b1f24;
          --ft-field: #0d1117;
          --ft-line: rgba(255,255,255,.28);
          --ft-edge: rgba(255,255,255,.08);
          --ft-shadow: 0 8px 28px rgba(0,0,0,.35);
        }
      }
      * { box-sizing: border-box; }
      button, input, select, textarea { font: 13px system-ui, sans-serif; color: var(--ft-text); }
      button { background: transparent; border: 1px solid var(--ft-line); border-radius: 8px; cursor: pointer; }
      button:disabled { opacity: .35; cursor: default; }
      .marks { position: absolute; left: 0; top: 0; width: 0; height: 0; overflow: visible; }
      .capture { position: fixed; inset: 0; z-index: 1; background: transparent; pointer-events: none; touch-action: none; }
      .capture.armed { pointer-events: auto; cursor: crosshair; }
      .capture[data-tool="move"] { cursor: move; }
      .capture[data-tool="erase"] { cursor: cell; }
      .capture[data-tool="text"] { cursor: text; }
      .hit { cursor: move; touch-action: none; }
      .panel, .popover { position: fixed; z-index: 2; pointer-events: auto; color: var(--ft-text); background: var(--ft-bg); color-scheme: light dark; border-radius: 12px; box-shadow: var(--ft-shadow), 0 0 0 1px var(--ft-edge); }
      .panel { top: 16px; left: 16px; width: 292px; padding: 8px; }
      .panel[hidden] { display: none; }
      .title { display: flex; align-items: center; gap: 8px; cursor: move; user-select: none; padding: 2px 2px 8px; }
      .title strong { flex: 1; font: 600 13px system-ui, sans-serif; }
      .title button, .history button { width: 28px; height: 28px; display: grid; place-items: center; }
      .history { display: flex; gap: 6px; margin-bottom: 8px; align-items: center; }
      .history select { flex: 1; min-width: 0; height: 28px; background: var(--ft-field); border: 1px solid var(--ft-line); border-radius: 8px; padding: 0 4px; }
      .tools { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
      .tools button { height: 36px; display: grid; place-items: center; }
      .tools button[aria-pressed="true"] { color: var(--ft-accent); border-color: var(--ft-accent); }
      svg.icon { width: 18px; height: 18px; display: block; }
      .options { display: grid; gap: 8px; margin-top: 8px; }
      .options label, .options .field { display: grid; gap: 4px; font: 12px system-ui, sans-serif; }
      .options p { margin: 0; color: var(--ft-muted); font: 12px system-ui, sans-serif; }
      .options input[type="number"], .options select, .options input[type="color"] { width: 100%; background: var(--ft-field); border: 1px solid var(--ft-line); border-radius: 8px; padding: 4px 6px; }
      .options input[type="color"] { height: 32px; padding: 2px; }
      .options input[type="range"] { width: 100%; accent-color: var(--ft-accent); }
      .swatches, .sizes, .actions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
      .swatches button { width: 18px; height: 18px; border-radius: 50%; padding: 0; }
      .swatches button[aria-pressed="true"] { outline: 2px solid var(--ft-accent); outline-offset: 1px; }
      .sizes button[aria-pressed="true"], .actions button.primary, .popover button.primary { background: var(--ft-accent); border-color: var(--ft-accent); color: #fff; }
      .check { display: flex; align-items: center; gap: 6px; }
      .popover { z-index: 3; width: 240px; padding: 8px; display: grid; gap: 8px; }
      .popover[hidden] { display: none; }
      .popover textarea { width: 100%; min-height: 64px; resize: vertical; background: var(--ft-field); border: 1px solid var(--ft-line); border-radius: 8px; padding: 6px; color: var(--ft-text); }
      .popover .actions { justify-content: flex-end; }
    </style>
    <div class="capture"></div>
    <div class="marks"></div>
    <section class="panel" role="dialog" aria-label="Felt Tip">
      <div class="title">
        <strong>Felt Tip</strong>
        <button type="button" data-action="close" title="Close" aria-label="Close"></button>
      </div>
      <div class="history">
        <button type="button" data-action="undo" title="Undo" aria-label="Undo"></button>
        <button type="button" data-action="redo" title="Redo" aria-label="Redo"></button>
        <button type="button" data-action="clear" title="Clear marks on this page" aria-label="Clear marks on this page" disabled></button>
        <select data-action="lifetime" aria-label="How long marks stay" title="How long marks stay"></select>
      </div>
      <div class="tools" role="group" aria-label="Tools"></div>
      <div class="options"></div>
    </section>
    <div class="popover" hidden>
      <textarea aria-label="Text"></textarea>
      <div class="actions">
        <button type="button" data-action="cancel-text">Cancel</button>
        <button type="button" class="primary" data-action="place-text">Place text</button>
      </div>
    </div>
  `;

  const capture = shadow.querySelector(".capture");
  const marks = shadow.querySelector(".marks");
  const panel = shadow.querySelector(".panel");
  if (restoreOnly) panel.hidden = true;
  const tools = shadow.querySelector(".tools");
  const options = shadow.querySelector(".options");
  const textPopover = shadow.querySelector(".popover");
  const textArea = textPopover.querySelector("textarea");
  const placeButton = textPopover.querySelector("[data-action='place-text']");
  const undoButton = shadow.querySelector("[data-action='undo']");
  const redoButton = shadow.querySelector("[data-action='redo']");
  const clearButton = shadow.querySelector("[data-action='clear']");
  const lifetimeSelect = shadow.querySelector("[data-action='lifetime']");
  undoButton.append(iconElement("undo"));
  redoButton.append(iconElement("redo"));
  clearButton.append(iconElement("clear"));
  shadow.querySelector("[data-action='close']").append(iconElement("close"));

  let port = null;
  let api = null;
  let closed = false;
  let unwatch = () => {};
  let onKey = () => {};

  function connectPort() {
    const next = chrome.runtime.connect({ name: "annotate" });
    next.onMessage.addListener((message) => {
      if (message?.type === "toggle") togglePanel();
    });
    next.onDisconnect.addListener(() => {
      if (port === next) port = null;
    });
    port = next;
  }

  function ensurePort() {
    if (port) return;
    try { connectPort(); } catch { /* The extension was reloaded. */ }
  }

  function togglePanel() {
    ensurePort();
    if (api) api.toggle();
    else panel.hidden = !panel.hidden;
  }

  globalThis.__feltTipToggle = togglePanel;
  connectPort();

  shadow.querySelector("[data-action='close']").addEventListener("click", () => {
    if (api) api.hide();
    else {
      panel.hidden = true;
      textPopover.hidden = true;
    }
  });
  dragPanel(panel.querySelector(".title"));

  const modelUrl = chrome.runtime.getURL("src/lib/annotations.js");
  const storeUrl = chrome.runtime.getURL("src/lib/storage.js");
  Promise.all([import(modelUrl), import(storeUrl)]).then(([model, store]) => boot(model, store)).catch(() => shutdown());

  let stopHostWatch = () => {};
  let stopFreePointer = () => {};

  function attachHost() {
    const root = document.documentElement;
    if (!root || closed) return;
    root.dataset.feltTipWatch = "1";
    if (host.parentNode !== root) root.append(host);
  }

  // Next.js renders <html> itself, so a commit can drop a node it does not own.
  // The same host is put back, with its shadow tree and marks intact.
  function watchHost() {
    const onHtml = new MutationObserver(() => attachHost());
    const onDocument = new MutationObserver(() => {
      onHtml.disconnect();
      if (document.documentElement) onHtml.observe(document.documentElement, { childList: true });
      attachHost();
    });
    if (document.documentElement) onHtml.observe(document.documentElement, { childList: true });
    onDocument.observe(document, { childList: true });
    stopHostWatch = () => {
      onHtml.disconnect();
      onDocument.disconnect();
    };
  }

  function mountHost() {
    watchHost();
    attachHost();
  }

  if (document.readyState === "complete") mountHost();
  else window.addEventListener("load", mountHost, { once: true });

  function flushOnHide() {
    persistNow();
  }

  function shutdown() {
    if (closed) return;
    closed = true;
    const done = typeof persistNow === "function" ? persistNow() : Promise.resolve();
    done.finally(() => {
      stopHostWatch();
      stopFreePointer();
      window.removeEventListener("pagehide", flushOnHide);
      window.removeEventListener("load", mountHost);
      delete document.documentElement?.dataset.feltTipWatch;
      unwatch();
      window.removeEventListener("keydown", onKey);
      host.remove();
      globalThis.__feltTipActive = false;
      try { port.disconnect(); } catch { /* Already gone. */ }
    });
  }

  let persistNow = () => Promise.resolve();
  window.addEventListener("pagehide", flushOnHide);

  async function boot(model, store) {
    const measure = document.createElement("canvas").getContext("2d");
    for (const option of store.LIFETIMES) {
      const node = document.createElement("option");
      node.value = option.id;
      node.textContent = option.label;
      lifetimeSelect.append(node);
    }
    lifetimeSelect.value = "forever";
    let toolPrefs = store.DEFAULT_TOOL;
    let lifetime = "forever";
    let pages = {};
    let currentKey = store.pageKey(location.href);
    let annotations = [];
    let undoStack = [];
    let redoStack = [];
    let currentTool = "pen";
    let draft = null;
    let drag = null;
    let moving = null;
    let pendingSelect = null;
    let pendingStep = null;
    let eraseHover = -1;
    let selected = -1;
    let textTarget = null;
    let textPoint = null;
    let saveTimer = 0;

    const stored = await store.loadState();
    if (closed) return;
    toolPrefs = stored.tool;
    lifetime = stored.lifetime || "forever";
    lifetimeSelect.value = lifetime;
    pages = stored.pages || {};
    annotations = model.normalizeAnnotations(store.pageRecord(pages, currentKey, lifetime)?.annotations);

    persistNow = () => {
      window.clearTimeout(saveTimer);
      if (!currentKey) return Promise.resolve();
      const next = { ...pages };
      if (annotations.length) next[currentKey] = { annotations, updatedAt: Date.now() };
      else delete next[currentKey];
      pages = store.prunePages(store.dropExpired(next, lifetime));
      return store.saveState({ tool: toolPrefs, lifetime, pages });
    };

    function scheduleSave() {
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => { persistNow(); }, 250);
    }

    function saveTool(patch) {
      toolPrefs = store.normalizeToolPrefs({ ...toolPrefs, ...patch });
      scheduleSave();
    }

    unwatch = watchHistory(() => {
      const next = store.pageKey(location.href);
      if (!next || next === currentKey) return;
      const nextPages = { ...pages };
      if (annotations.length) nextPages[currentKey] = { annotations, updatedAt: Date.now() };
      else delete nextPages[currentKey];
      pages = store.dropExpired(nextPages, lifetime);
      currentKey = next;
      annotations = model.normalizeAnnotations(store.pageRecord(pages, currentKey, lifetime)?.annotations);
      undoStack = [];
      redoStack = [];
      selected = -1;
      draft = null;
      drag = null;
      moving = null;
      hideText();
      renderTools();
      renderOptions();
      renderMarks();
      paintHistory();
      scheduleSave();
    });

    undoButton.addEventListener("click", () => undo());
    redoButton.addEventListener("click", () => redo());
    clearButton.addEventListener("click", () => clearPage());
    lifetimeSelect.addEventListener("change", () => applyLifetime(lifetimeSelect.value));
    placeButton.addEventListener("click", () => commitText());
    textPopover.querySelector("[data-action='cancel-text']").addEventListener("click", () => hideText());
    textArea.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        commitText();
      }
    });

    onKey = (event) => {
      if (panel.hidden) return;
      const target = event.composedPath()[0];
      const inOverlay = target instanceof Node && shadow.contains(target);
      if (isField(target) && !inOverlay) return;
      if (event.key === "Escape") {
        if (!textPopover.hidden) {
          hideText();
          event.preventDefault();
          return;
        }
        if (currentTool) {
          currentTool = null;
          selected = -1;
          renderTools();
          renderOptions();
          updateCapture();
          renderMarks();
          event.preventDefault();
        }
        return;
      }
      if (inOverlay && isField(target)) return;
      if (!inOverlay && !currentTool && selected < 0) return;
      const meta = event.ctrlKey || event.metaKey;
      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (meta && event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && selected >= 0) {
        event.preventDefault();
        eraseAnnotation(selected);
      }
    };
    window.addEventListener("keydown", onKey);

    capture.addEventListener("pointerdown", onPointerDown);
    capture.addEventListener("pointermove", onPointerMove);
    capture.addEventListener("pointerup", onPointerUp);
    capture.addEventListener("pointercancel", onPointerCancel);

    if (panel.hidden) {
      currentTool = null;
      selected = -1;
    }
    api = {
      hide: hidePanel,
      toggle() {
        if (panel.hidden) showPanel();
        else hidePanel();
      },
    };
    renderTools();
    renderOptions();
    updateCapture();
    renderMarks();
    paintHistory();

    function hidePanel() {
      if (moving) finishMoving();
      if (draft) finishDraft();
      pendingSelect = null;
      pendingStep = null;
      eraseHover = -1;
      hideText();
      currentTool = null;
      selected = -1;
      panel.hidden = true;
      renderTools();
      renderOptions();
      updateCapture();
      renderMarks();
      paintHistory();
      persistNow();
    }

    function showPanel() {
      panel.hidden = false;
      const annotation = annotations[selected];
      if (annotation) {
        armTool(annotation.type);
        if (annotation.type === "text") openTextEditor(annotation, true);
        else hideText();
      } else if (!currentTool) currentTool = "pen";
      renderTools();
      renderOptions();
      updateCapture();
      renderMarks();
    }

    function renderTools() {
      tools.replaceChildren();
      for (const [id, label] of TOOLS) {
        const button = document.createElement("button");
        button.type = "button";
        button.title = label;
        button.setAttribute("aria-label", label);
        button.setAttribute("aria-pressed", id === currentTool ? "true" : "false");
        button.append(iconElement(id));
        button.addEventListener("click", () => selectTool(id));
        tools.append(button);
      }
    }

    function selectTool(id) {
      currentTool = currentTool === id ? null : id;
      if (!currentTool) {
        selected = -1;
        hideText();
      }
      renderTools();
      renderOptions();
      updateCapture();
      renderMarks();
    }

    function armTool(id) {
      currentTool = id;
      renderTools();
      updateCapture();
    }

    function updateCapture() {
      const armed = currentTool != null;
      capture.classList.toggle("armed", armed);
      capture.dataset.tool = currentTool || "";
      capture.style.pointerEvents = armed ? "auto" : "none";
      if (!armed) capture.style.cursor = "";
    }

    function renderOptions() {
      options.replaceChildren();
      if (currentTool === "pen") strokeOptions("color", "strokeWidth", "strokeOpacity", model.STROKE_COLORS, 1, 64);
      else if (currentTool === "highlight") strokeOptions("highlightColor", "highlightWidth", "highlightOpacity", model.HIGHLIGHT_COLORS, 1, 80);
      else if (currentTool === "rect" || currentTool === "ellipse" || currentTool === "arrow") strokeOptions("shapeColor", "shapeWidth", "shapeOpacity", model.STROKE_COLORS, 1, 64);
      else if (currentTool === "text") textOptions();
      else if (currentTool === "step") stepOptions();
      else if (currentTool === "blur") blurOptions();
      else if (currentTool === "move") hint("Drag a mark to a new place.");
      else if (currentTool === "erase") hint("Click a mark to remove it.");
      else hint("Click a mark to edit it. Drag a mark to move it.");
    }

    function hint(text) {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      options.append(paragraph);
    }

    function strokeOptions(colorKey, widthKey, opacityKey, colors, minWidth, maxWidth) {
      const editing = strokeTarget(colorKey);
      const color = colorInput(editing ? editing.color : toolPrefs[colorKey], "#e23b2f");
      const width = numberInput(editing ? editing.width : toolPrefs[widthKey], minWidth, maxWidth);
      const opacity = rangeInput(editing ? model.strokeOpacity(editing) : toolPrefs[opacityKey]);
      const readout = document.createElement("span");
      const paint = () => { readout.textContent = `${opacity.value}%`; };
      paint();
      let widthGesture = false;
      let opacityGesture = false;
      let colorGesture = false;
      const apply = (checkpoint) => {
        const patch = {
          color: color.value,
          width: clamp(width.value, minWidth, maxWidth),
          opacity: clamp(opacity.value, 0, 100),
        };
        if (!Number.isFinite(patch.width) || !Number.isFinite(patch.opacity)) return;
        const mark = strokeTarget(colorKey);
        if (!mark) {
          saveTool({ [colorKey]: patch.color, [widthKey]: patch.width, [opacityKey]: patch.opacity });
          return;
        }
        if (sameColor(mark.color, patch.color) && mark.width === patch.width && model.strokeOpacity(mark) === patch.opacity) return;
        if (checkpoint) remember();
        annotations[selected] = { ...annotations[selected], ...patch };
        renderMarks();
        scheduleSave();
      };
      const swatch = swatches(colors, color, () => apply(true));
      if (editing) hint("Changes apply to this mark.");
      options.append(
        field("Color", swatch, color),
        field("Width", width),
        field("Opacity", opacity, readout),
      );
      bindNumber(width, () => apply(!widthGesture), () => { widthGesture = true; }, () => { widthGesture = false; });
      bindNumber(opacity, () => { paint(); apply(!opacityGesture); }, () => { opacityGesture = true; }, () => { opacityGesture = false; });
      color.addEventListener("input", () => {
        markSwatches(swatch, color.value);
        apply(!colorGesture);
        colorGesture = true;
      });
      color.addEventListener("change", () => {
        markSwatches(swatch, color.value);
        if (!colorGesture) apply(true);
        colorGesture = false;
      });
    }

    function strokeTarget(colorKey) {
      const mark = annotations[selected];
      if (!mark) return null;
      if (colorKey === "color" && mark.type === "pen") return mark;
      if (colorKey === "highlightColor" && mark.type === "highlight") return mark;
      if (colorKey === "shapeColor" && (mark.type === "rect" || mark.type === "ellipse" || mark.type === "arrow")) return mark;
      return null;
    }

    function textOptions() {
      const editing = annotations[selected]?.type === "text" ? annotations[selected] : null;
      const font = document.createElement("select");
      for (const name of model.FONTS) font.append(new Option(name, name));
      font.value = editing ? editing.font : toolPrefs.font;
      const size = numberInput(editing ? editing.size : toolPrefs.fontSize, 8, 240);
      const color = colorInput(editing ? editing.color : toolPrefs.textColor, "#111111");
      const background = colorInput(editing ? editing.bg : toolPrefs.textBg, "#ffffff");
      const opacity = rangeInput(editing ? (editing.bgOpacity ?? 0) : toolPrefs.textBgOpacity);
      const readout = document.createElement("span");
      const paint = () => { readout.textContent = `${opacity.value}%`; };
      paint();
      const shadow = document.createElement("input");
      shadow.type = "checkbox";
      shadow.checked = editing ? Boolean(editing.shadow) : toolPrefs.textShadow;
      const shadowSize = numberInput(editing ? editing.shadowBlur : toolPrefs.shadowBlur, 0, 40);
      let sizeGesture = false;
      let colorGesture = false;
      let backgroundGesture = false;
      let opacityGesture = false;
      let shadowGesture = false;
      const apply = (checkpoint) => {
        const patch = {
          font: font.value,
          size: clamp(size.value, 8, 240),
          color: color.value,
          bg: background.value,
          bgOpacity: clamp(opacity.value, 0, 100),
          shadow: shadow.checked,
          shadowBlur: clamp(shadowSize.value, 0, 40),
        };
        if (!Number.isFinite(patch.size) || !Number.isFinite(patch.shadowBlur)) return;
        const mark = annotations[selected]?.type === "text" ? annotations[selected] : null;
        if (!mark) {
          saveTool({
            font: patch.font,
            fontSize: patch.size,
            textColor: patch.color,
            textBg: patch.bg,
            textBgOpacity: patch.bgOpacity,
            textShadow: patch.shadow,
            shadowBlur: patch.shadowBlur,
          });
          return;
        }
        const unchanged = mark.font === patch.font
          && mark.size === patch.size
          && sameColor(mark.color, patch.color)
          && sameColor(mark.bg, patch.bg)
          && Number(mark.bgOpacity) === patch.bgOpacity
          && Boolean(mark.shadow) === patch.shadow
          && mark.shadowBlur === patch.shadowBlur;
        if (unchanged) return;
        if (checkpoint) remember();
        annotations[selected] = { ...annotations[selected], ...patch };
        renderMarks();
        scheduleSave();
      };
      const swatch = swatches(model.TEXT_COLORS, color, () => apply(true));
      if (editing) hint("Selected text. Changes apply to this mark.");
      const shadowLabel = document.createElement("label");
      shadowLabel.className = "check";
      shadowLabel.append(shadow, "Shadow");
      options.append(
        field("Font", font),
        field("Size", size),
        field("Color", swatch, color),
        field("Background", background),
        field("Background opacity", opacity, readout),
        shadowLabel,
        field("Shadow size", shadowSize),
      );
      font.addEventListener("change", () => apply(true));
      shadow.addEventListener("change", () => apply(true));
      bindNumber(size, () => apply(!sizeGesture), () => { sizeGesture = true; }, () => { sizeGesture = false; });
      bindNumber(opacity, () => { paint(); apply(!opacityGesture); }, () => { opacityGesture = true; }, () => { opacityGesture = false; });
      bindNumber(shadowSize, () => apply(!shadowGesture), () => { shadowGesture = true; }, () => { shadowGesture = false; });
      color.addEventListener("input", () => {
        markSwatches(swatch, color.value);
        apply(!colorGesture);
        colorGesture = true;
      });
      color.addEventListener("change", () => {
        markSwatches(swatch, color.value);
        if (!colorGesture) apply(true);
        colorGesture = false;
      });
      background.addEventListener("input", () => { apply(!backgroundGesture); backgroundGesture = true; });
      background.addEventListener("change", () => { if (!backgroundGesture) apply(true); backgroundGesture = false; });
    }

    function stepOptions() {
      const look = stepLook();
      const fill = colorInput(look.fill, "#e23b2f");
      const color = colorInput(look.color, "#ffffff");
      const size = numberInput(look.size, 16, 96);
      const start = numberInput(look.start, 1, 9999);
      const sizes = document.createElement("div");
      sizes.className = "sizes";
      sizes.setAttribute("role", "group");
      sizes.setAttribute("aria-label", "Step size");
      let sizeGesture = false;
      let fillGesture = false;
      let colorGesture = false;
      let startGesture = false;
      const apply = (checkpoint) => {
        const rawSize = clamp(size.value, 16, 96);
        const origin = clamp(start.value, 1, 9999);
        if (!Number.isFinite(rawSize) || !Number.isFinite(origin)) return;
        const patch = { fill: fill.value, color: color.value, size: rawSize };
        const steps = annotations.filter((item) => item.type === "step");
        const sameStyle = steps.every((item) => sameColor(item.fill, patch.fill) && sameColor(item.color, patch.color) && item.size === patch.size);
        const ordered = steps.slice().sort((a, b) => (a.n ?? 0) - (b.n ?? 0));
        const startSame = ordered.every((item, index) => item.n === origin + index);
        const toolPatch = { stepFill: patch.fill, stepColor: patch.color, stepSize: patch.size, stepStart: origin };
        const toolSame = sameColor(toolPrefs.stepFill, patch.fill)
          && sameColor(toolPrefs.stepColor, patch.color)
          && toolPrefs.stepSize === patch.size
          && model.clampStepStart(toolPrefs.stepStart) === origin;
        if (!steps.length || (sameStyle && startSame)) {
          if (!toolSame) saveTool(toolPatch);
          return;
        }
        if (checkpoint) remember();
        annotations = model.renumberSteps(model.paintSteps(annotations, patch), origin);
        if (!toolSame) saveTool(toolPatch);
        renderMarks();
        scheduleSave();
      };
      hint(annotations[selected]?.type === "step"
        ? "Selected step. Style changes apply to every step."
        : "Click the page to place the next number.");
      const fillSwatch = swatches(model.STROKE_COLORS, fill, () => apply(true));
      const colorSwatch = swatches(model.STEP_TEXT_COLORS, color, () => apply(true));
      for (const [name, value] of model.STEP_SIZES) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = name;
        button.dataset.size = String(value);
        button.addEventListener("click", () => {
          size.value = String(value);
          markSizes(sizes, value);
          apply(true);
        });
        sizes.append(button);
      }
      markSizes(sizes, Number(size.value));
      const restart = document.createElement("button");
      restart.type = "button";
      restart.textContent = "Restart from 1";
      restart.addEventListener("click", () => {
        start.value = "1";
        apply(true);
      });
      options.append(
        field("Fill", fillSwatch, fill),
        field("Text", colorSwatch, color),
        field("Size", size),
        sizes,
        field("Start at", start),
        restart,
      );
      bindNumber(size, () => { markSizes(sizes, Number(size.value)); apply(!sizeGesture); }, () => { sizeGesture = true; }, () => { sizeGesture = false; });
      bindNumber(start, () => apply(!startGesture), () => { startGesture = true; }, () => { startGesture = false; });
      fill.addEventListener("input", () => { markSwatches(fillSwatch, fill.value); apply(!fillGesture); fillGesture = true; });
      fill.addEventListener("change", () => { markSwatches(fillSwatch, fill.value); if (!fillGesture) apply(true); fillGesture = false; });
      color.addEventListener("input", () => { markSwatches(colorSwatch, color.value); apply(!colorGesture); colorGesture = true; });
      color.addEventListener("change", () => { markSwatches(colorSwatch, color.value); if (!colorGesture) apply(true); colorGesture = false; });
    }

    function blurOptions() {
      const editing = annotations[selected]?.type === "blur" ? annotations[selected] : null;
      const radius = numberInput(editing ? editing.radius : toolPrefs.blurRadius, 2, 40);
      let gesture = false;
      const apply = (checkpoint) => {
        const value = clamp(radius.value, 2, 40);
        if (!Number.isFinite(value)) return;
        const mark = annotations[selected]?.type === "blur" ? annotations[selected] : null;
        if (!mark) {
          if (toolPrefs.blurRadius !== value) saveTool({ blurRadius: value });
          return;
        }
        if (mark.radius === value) return;
        if (checkpoint) remember();
        annotations[selected] = { ...mark, radius: value };
        renderMarks();
        scheduleSave();
      };
      hint(editing ? "Changes apply to this blur." : "Drag the zone to blur.");
      options.append(field("Blur radius", radius));
      bindNumber(radius, () => apply(!gesture), () => { gesture = true; }, () => { gesture = false; });
    }

    function stepLook() {
      const steps = annotations.filter((item) => item.type === "step");
      steps.sort((a, b) => (a.n ?? 0) - (b.n ?? 0));
      const first = steps[0];
      const selectedStep = annotations[selected]?.type === "step" ? annotations[selected] : null;
      const sample = selectedStep || first;
      return {
        fill: sample?.fill || toolPrefs.stepFill,
        color: sample?.color || toolPrefs.stepColor,
        size: sample?.size || toolPrefs.stepSize,
        start: first ? model.clampStepStart(first.n) : model.clampStepStart(toolPrefs.stepStart),
      };
    }

    function onPointerDown(event) {
      if (event.button !== 0) return;
      event.preventDefault();
      const point = pagePoint(event);
      if (currentTool === "move") {
        const index = model.hitAnnotation(measure, annotations, point);
        if (index < 0) return;
        remember();
        moving = { index, last: point, distance: 0, selectIfStill: true };
        capture.setPointerCapture(event.pointerId);
        renderMarks();
        return;
      }
      if (currentTool === "erase") {
        const index = model.hitAnnotation(measure, annotations, point);
        if (index < 0) return;
        eraseAnnotation(index);
        eraseHover = model.hitAnnotation(measure, annotations, point);
        renderMarks();
        return;
      }
      if (canPickShape()) {
        const index = shapeAt(point);
        if (index >= 0) {
          pendingSelect = { index, x: point.x, y: point.y };
          capture.setPointerCapture(event.pointerId);
          return;
        }
        if (currentTool === "step") {
          pendingStep = { x: point.x, y: point.y };
          capture.setPointerCapture(event.pointerId);
          return;
        }
        if (currentTool === "text") {
          selected = -1;
          openTextEditor(point, false);
          renderOptions();
          renderMarks();
          return;
        }
        if (selected >= 0 && !canDraw()) {
          selected = -1;
          hideText();
          renderOptions();
          renderMarks();
          return;
        }
      }
      if (!canDraw()) return;
      beginShape(event, point);
    }

    function onPointerMove(event) {
      const point = pagePoint(event);
      // A press that hits a mark never starts a new shape. A small drag moves that mark.
      if (pendingSelect) {
        if (pointerDistance(point, pendingSelect) < SELECT_CLICK_PX) return;
        const origin = { x: pendingSelect.x, y: pendingSelect.y };
        const index = pendingSelect.index;
        pendingSelect = null;
        remember();
        moving = { index, last: origin, distance: 0, selectOnEnd: true };
        selected = index;
        dragMoving(point);
        return;
      }
      if (pendingStep) {
        if (pointerDistance(point, pendingStep) >= SELECT_CLICK_PX) pendingStep = null;
        return;
      }
      if (currentTool === "erase") {
        const index = model.hitAnnotation(measure, annotations, point);
        if (index === eraseHover) return;
        eraseHover = index;
        renderMarks();
        return;
      }
      if (moving) {
        dragMoving(point);
        return;
      }
      if (!draft) return;
      updateDraft(point);
    }

    function onPointerUp(event) {
      if (pendingSelect) {
        if (event.type === "pointercancel") {
          const free = pendingSelect.freeMove;
          pendingSelect = null;
          if (free) releaseFreePointer();
          return;
        }
        const pending = pendingSelect;
        pendingSelect = null;
        if (pending.freeMove) releaseFreePointer();
        chooseDrawn(pending.index);
        return;
      }
      if (pendingStep) {
        const origin = pendingStep;
        pendingStep = null;
        if (event.type === "pointercancel") return;
        if (pointerDistance(pagePoint(event), origin) >= SELECT_CLICK_PX) return;
        placeStep(origin);
        return;
      }
      if (moving) {
        const free = currentTool == null;
        const outcome = finishMoving();
        if (free) releaseFreePointer();
        if (outcome.selectOnEnd || (outcome.selectIfStill && outcome.still)) chooseDrawn(outcome.index);
        return;
      }
      if (!draft) return;
      finishDraft();
    }

    function dragMoving(point) {
      const dx = point.x - moving.last.x;
      const dy = point.y - moving.last.y;
      moving.last = point;
      moving.distance += Math.hypot(dx, dy);
      annotations = annotations.map((item, index) => (
        index === moving.index ? model.translateAnnotation(item, dx, dy) : item
      ));
      renderMarks();
    }

    function finishMoving() {
      const index = moving.index;
      const selectOnEnd = Boolean(moving.selectOnEnd);
      const selectIfStill = Boolean(moving.selectIfStill);
      let still = false;
      if (moving.distance < 1) {
        const entry = undoStack.pop();
        if (entry) annotations = entry.annotations;
        paintHistory();
        still = true;
      } else scheduleSave();
      moving = null;
      renderMarks();
      return { index, selectOnEnd, selectIfStill, still };
    }

    function releaseFreePointer() {
      updateCapture();
    }

    // The page stays clickable while no tool is armed, so a mark keeps its own drag handle.
    function onFreeHit(event) {
      if (currentTool != null || event.button !== 0 || moving || pendingSelect) return;
      const index = Number(event.currentTarget?.dataset.index);
      if (!annotations[index]) return;
      event.preventDefault();
      event.stopPropagation();
      const point = pagePoint(event);
      pendingSelect = { index, x: point.x, y: point.y, freeMove: true };
      capture.style.pointerEvents = "auto";
      capture.style.cursor = "move";
      try { capture.setPointerCapture(event.pointerId); } catch { /* Capture can fail after the pointer ends. */ }
    }

    function onFreeBackground(event) {
      if (currentTool != null || event.button !== 0 || moving || pendingSelect) return;
      const path = event.composedPath();
      if (path.includes(panel) || path.includes(textPopover)) return;
      if (path.some((node) => node instanceof Element && node.classList?.contains("hit"))) return;
      if (selected < 0) return;
      selected = -1;
      renderMarks();
    }

    window.addEventListener("pointerdown", onFreeBackground, true);
    stopFreePointer = () => {
      window.removeEventListener("pointerdown", onFreeBackground, true);
      capture.style.cursor = "";
    };

    function onPointerCancel() {
      const free = pendingSelect?.freeMove || (moving && currentTool == null);
      pendingSelect = null;
      pendingStep = null;
      if (moving) {
        const selectOnEnd = moving.selectOnEnd;
        const entry = undoStack.pop();
        if (entry) {
          annotations = entry.annotations;
          if (selectOnEnd) selected = entry.selected;
        }
        moving = null;
        paintHistory();
      }
      if (free) releaseFreePointer();
      if (draft) {
        undoStack.pop();
        draft = null;
        drag = null;
        paintHistory();
      }
      renderMarks();
    }

    function beginShape(event, point) {
      pendingSelect = null;
      pendingStep = null;
      hideText();
      remember();
      if (selected >= 0) {
        selected = -1;
        renderOptions();
      }
      try { capture.setPointerCapture(event.pointerId); } catch { /* Capture can fail after the pointer ends. */ }
      if (currentTool === "pen" || currentTool === "highlight") {
        draft = {
          type: currentTool,
          color: currentTool === "highlight" ? toolPrefs.highlightColor : toolPrefs.color,
          width: currentTool === "highlight" ? toolPrefs.highlightWidth : toolPrefs.strokeWidth,
          opacity: currentTool === "highlight" ? toolPrefs.highlightOpacity : toolPrefs.strokeOpacity,
          points: [{ x: point.x, y: point.y }],
        };
      } else if (currentTool === "arrow") {
        draft = {
          type: "arrow",
          x1: point.x,
          y1: point.y,
          x2: point.x,
          y2: point.y,
          color: toolPrefs.shapeColor,
          width: toolPrefs.shapeWidth,
          opacity: toolPrefs.shapeOpacity,
        };
      } else if (currentTool === "blur") {
        drag = { x: point.x, y: point.y };
        draft = { type: "blur", x: point.x, y: point.y, w: 0, h: 0, radius: toolPrefs.blurRadius };
      } else {
        drag = { x: point.x, y: point.y };
        draft = {
          type: currentTool,
          x: point.x,
          y: point.y,
          w: 0,
          h: 0,
          color: toolPrefs.shapeColor,
          width: toolPrefs.shapeWidth,
          opacity: toolPrefs.shapeOpacity,
        };
      }
      renderMarks();
    }

    function updateDraft(point) {
      if (!draft) return;
      if (draft.points) draft.points.push({ x: point.x, y: point.y });
      else if (draft.type === "arrow") {
        draft.x2 = point.x;
        draft.y2 = point.y;
      } else if (drag) {
        draft = { ...draft, ...model.normalizeRect(drag.x, drag.y, point.x, point.y) };
      }
      renderMarks();
    }

    function finishDraft() {
      const finished = draft;
      draft = null;
      drag = null;
      const tiny = (finished.w != null && (finished.w < 2 || finished.h < 2))
        || (finished.points && finished.points.length < 2)
        || (finished.type === "arrow" && Math.hypot(finished.x2 - finished.x1, finished.y2 - finished.y1) < 2);
      if (tiny) {
        undoStack.pop();
        paintHistory();
        renderMarks();
        return;
      }
      annotations = [...annotations, finished];
      renderMarks();
      scheduleSave();
    }

    function placeStep(point) {
      const look = stepLook();
      remember();
      annotations = [...annotations, {
        type: "step",
        x: point.x,
        y: point.y,
        n: model.nextStepNumber(annotations, look.start),
        fill: look.fill,
        color: look.color,
        size: look.size,
      }];
      selected = annotations.length - 1;
      armTool("step");
      renderOptions();
      renderMarks();
      scheduleSave();
    }

    function chooseDrawn(index) {
      selected = index;
      const annotation = annotations[selected];
      if (!annotation) return;
      // A hidden toolbox stays out of the page's way. Opening it adopts this mark.
      if (!panel.hidden) {
        armTool(annotation.type);
        if (annotation.type === "text") openTextEditor(annotation, true);
        else hideText();
      }
      renderOptions();
      renderMarks();
    }

    function eraseAnnotation(index) {
      if (!annotations[index]) return;
      remember();
      const removed = annotations[index];
      const start = stepLook().start;
      let next = annotations.filter((_, itemIndex) => itemIndex !== index);
      if (removed.type === "step") next = model.renumberSteps(next, start);
      annotations = next;
      if (selected === index) {
        selected = -1;
        hideText();
      } else if (selected > index) selected -= 1;
      renderOptions();
      renderMarks();
      scheduleSave();
    }

    function openTextEditor(pointOrAnnotation, existing) {
      textTarget = existing ? pointOrAnnotation : null;
      textPoint = { x: pointOrAnnotation.x, y: pointOrAnnotation.y };
      textArea.value = existing ? pointOrAnnotation.text || "" : "";
      textPopover.hidden = false;
      const clientX = pointOrAnnotation.clientX ?? (pointOrAnnotation.x - window.scrollX);
      const clientY = pointOrAnnotation.clientY ?? (pointOrAnnotation.y - window.scrollY);
      const width = 240;
      const maxLeft = Math.max(8, window.innerWidth - width - 8);
      const maxTop = Math.max(8, window.innerHeight - 120);
      textPopover.style.left = `${Math.min(Math.max(8, clientX), maxLeft)}px`;
      textPopover.style.top = `${Math.min(Math.max(8, clientY), maxTop)}px`;
      placeButton.textContent = existing ? "Update text" : "Place text";
      textArea.focus();
    }

    function hideText() {
      textTarget = null;
      textPoint = null;
      textPopover.hidden = true;
      textArea.value = "";
    }

    function commitText() {
      const text = textArea.value.trim();
      const editing = textTarget && annotations[selected]?.type === "text" ? annotations[selected] : null;
      const point = textPoint;
      hideText();
      if (!text || !point) return;
      if (editing) {
        if (editing.text === text) return;
        remember();
        annotations[selected] = { ...annotations[selected], text };
      } else {
        remember();
        annotations = [...annotations, {
          type: "text",
          x: point.x,
          y: point.y,
          text,
          font: toolPrefs.font,
          size: toolPrefs.fontSize,
          color: toolPrefs.textColor,
          bg: toolPrefs.textBg,
          bgOpacity: toolPrefs.textBgOpacity,
          shadow: toolPrefs.textShadow,
          shadowBlur: toolPrefs.shadowBlur,
        }];
      }
      renderMarks();
      scheduleSave();
    }

    function snapshot() {
      return { annotations: structuredClone(annotations), selected };
    }

    function remember() {
      undoStack.push(snapshot());
      if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
      redoStack = [];
      paintHistory();
    }

    function undo() {
      const entry = undoStack.pop();
      if (!entry) return;
      redoStack.push(snapshot());
      annotations = entry.annotations;
      selected = entry.selected;
      eraseHover = -1;
      syncSelection();
      scheduleSave();
    }

    function redo() {
      const entry = redoStack.pop();
      if (!entry) return;
      undoStack.push(snapshot());
      annotations = entry.annotations;
      selected = entry.selected;
      eraseHover = -1;
      syncSelection();
      scheduleSave();
    }

    function syncSelection() {
      pendingSelect = null;
      pendingStep = null;
      draft = null;
      drag = null;
      if (!isSelectable(annotations[selected])) {
        selected = -1;
        hideText();
      } else if (annotations[selected].type === "text") {
        armTool("text");
        if (textPopover.hidden) openTextEditor(annotations[selected], true);
      } else {
        armTool(annotations[selected].type);
        hideText();
      }
      renderOptions();
      renderMarks();
      paintHistory();
    }

    function paintHistory() {
      undoButton.disabled = undoStack.length === 0;
      redoButton.disabled = redoStack.length === 0;
      clearButton.disabled = annotations.length === 0;
    }

    function discardMarks() {
      hideText();
      pendingSelect = null;
      pendingStep = null;
      draft = null;
      drag = null;
      moving = null;
      eraseHover = -1;
      if (annotations.length) remember();
      annotations = [];
      selected = -1;
      renderOptions();
      updateCapture();
      renderMarks();
    }

    function clearPage() {
      if (!annotations.length && !draft) return;
      discardMarks();
      persistNow();
    }

    function applyLifetime(id) {
      lifetime = store.normalizeLifetime(id);
      lifetimeSelect.value = lifetime;
      const previous = pages[currentKey];
      const expired = Boolean(previous) && !store.isPageFresh(previous, lifetime);
      pages = store.dropExpired(pages, lifetime);
      if (expired && undoStack.length === 0 && !draft) discardMarks();
      persistNow();
    }

    function canPickShape() {
      return currentTool == null
        || currentTool === "text"
        || currentTool === "step"
        || currentTool === "blur"
        || SHAPE_TOOLS.includes(currentTool);
    }

    function canDraw() {
      return SHAPE_TOOLS.includes(currentTool) || currentTool === "blur";
    }

    function isSelectable(annotation) {
      return Boolean(annotation) && (
        annotation.type === "text"
        || annotation.type === "step"
        || annotation.type === "blur"
        || SHAPE_TOOLS.includes(annotation.type)
      );
    }

    function shapeAt(point) {
      const index = model.hitAnnotation(measure, annotations, point);
      if (!isSelectable(annotations[index])) return -1;
      return index;
    }

    function renderMarks() {
      marks.replaceChildren();
      const list = draft ? [...annotations, draft] : annotations;
      for (const annotation of list) {
        const node = renderMark(annotation);
        if (node) marks.append(node);
      }
      if (!draft && selected >= 0 && annotations[selected]) {
        const outline = outlineFor(annotations[selected], "selected");
        if (outline) marks.append(outline);
      }
      if (currentTool === "erase" && eraseHover >= 0 && annotations[eraseHover]) {
        const outline = outlineFor(annotations[eraseHover], "erase");
        if (outline) marks.append(outline);
      }
      if (currentTool == null) {
        annotations.forEach((annotation, index) => {
          const hit = renderHit(annotation, index);
          if (hit) marks.append(hit);
        });
      }
      paintHistory();
    }

    function renderHit(annotation, index) {
      if (annotation.type === "pen" || annotation.type === "highlight") return renderStrokeHit(annotation, index);
      if (annotation.type === "rect") return renderBoxHit(annotation, index, hitPad(annotation));
      if (annotation.type === "blur") return renderBoxHit(annotation, index, 0);
      if (annotation.type === "ellipse") return renderEllipseHit(annotation, index);
      if (annotation.type === "arrow") return renderArrowHit(annotation, index);
      if (annotation.type === "text") return renderTextHit(annotation, index);
      if (annotation.type === "step") return renderStepHit(annotation, index);
      return null;
    }

    function hitPad(annotation) {
      return Math.max(6, (Number(annotation.width) || 0) / 2 + 4);
    }

    function armHit(el, index) {
      el.classList.add("hit");
      el.dataset.index = String(index);
      el.style.cursor = "move";
      el.style.touchAction = "none";
      el.addEventListener("pointerdown", onFreeHit);
      return el;
    }

    function renderStrokeHit(annotation, index) {
      const bounds = model.annotationBounds(measure, annotation);
      if (!bounds) return null;
      const pad = hitPad(annotation);
      const svg = emptySvg(bounds.w, bounds.h);
      svg.style.pointerEvents = "none";
      svg.style.overflow = "visible";
      const poly = svgEl("polyline");
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", "#000");
      poly.setAttribute("stroke-opacity", "0");
      poly.setAttribute("stroke-width", String(pad * 2));
      poly.setAttribute("stroke-linecap", "round");
      poly.setAttribute("stroke-linejoin", "round");
      poly.setAttribute("pointer-events", "stroke");
      poly.style.cursor = "move";
      poly.setAttribute("points", (annotation.points || []).map((point) => `${point.x - bounds.x},${point.y - bounds.y}`).join(" "));
      svg.append(poly);
      return armHit(wrap(svg, bounds.x, bounds.y, bounds.w, bounds.h), index);
    }

    function renderBoxHit(annotation, index, pad) {
      const el = document.createElement("div");
      place(el, annotation.x - pad, annotation.y - pad, Number(annotation.w) + pad * 2, Number(annotation.h) + pad * 2);
      el.style.pointerEvents = "auto";
      return armHit(el, index);
    }

    function renderEllipseHit(annotation, index) {
      const pad = hitPad(annotation);
      const rx = Math.max(1, Math.abs(Number(annotation.w) || 0) / 2 + pad);
      const ry = Math.max(1, Math.abs(Number(annotation.h) || 0) / 2 + pad);
      const cx = annotation.x + Number(annotation.w) / 2;
      const cy = annotation.y + Number(annotation.h) / 2;
      const svg = emptySvg(rx * 2, ry * 2);
      svg.style.pointerEvents = "none";
      const ell = svgEl("ellipse");
      ell.setAttribute("cx", String(rx));
      ell.setAttribute("cy", String(ry));
      ell.setAttribute("rx", String(rx));
      ell.setAttribute("ry", String(ry));
      ell.setAttribute("fill", "#000");
      ell.setAttribute("fill-opacity", "0");
      ell.setAttribute("pointer-events", "fill");
      ell.style.cursor = "move";
      svg.append(ell);
      return armHit(wrap(svg, cx - rx, cy - ry, rx * 2, ry * 2), index);
    }

    function renderArrowHit(annotation, index) {
      const bounds = model.annotationBounds(measure, annotation);
      if (!bounds) return null;
      const pad = hitPad(annotation);
      const originX = bounds.x - pad;
      const originY = bounds.y - pad;
      const svg = emptySvg(bounds.w + pad * 2, bounds.h + pad * 2);
      svg.style.pointerEvents = "none";
      svg.style.overflow = "visible";
      const line = svgEl("line");
      line.setAttribute("x1", String(annotation.x1 - originX));
      line.setAttribute("y1", String(annotation.y1 - originY));
      line.setAttribute("x2", String(annotation.x2 - originX));
      line.setAttribute("y2", String(annotation.y2 - originY));
      line.setAttribute("stroke", "#000");
      line.setAttribute("stroke-opacity", "0");
      line.setAttribute("stroke-width", String(pad * 2));
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("pointer-events", "stroke");
      line.style.cursor = "move";
      const head = model.arrowHead(annotation.x1, annotation.y1, annotation.x2, annotation.y2, Number(annotation.width) || 4);
      const polygon = svgEl("polygon");
      polygon.setAttribute("points", head.map((point) => `${point.x - originX},${point.y - originY}`).join(" "));
      polygon.setAttribute("fill", "#000");
      polygon.setAttribute("fill-opacity", "0");
      polygon.setAttribute("pointer-events", "fill");
      polygon.style.cursor = "move";
      svg.append(line, polygon);
      return armHit(wrap(svg, originX, originY, bounds.w + pad * 2, bounds.h + pad * 2), index);
    }

    function renderTextHit(annotation, index) {
      const bounds = model.textBounds(measure, annotation);
      if (!bounds) return null;
      const el = document.createElement("div");
      place(el, bounds.x, bounds.y, bounds.w, bounds.h);
      el.style.pointerEvents = "auto";
      return armHit(el, index);
    }

    function renderStepHit(annotation, index) {
      const radius = model.stepRadius(annotation) + 4;
      const svg = emptySvg(radius * 2, radius * 2);
      svg.style.pointerEvents = "none";
      const circle = svgEl("circle");
      circle.setAttribute("cx", String(radius));
      circle.setAttribute("cy", String(radius));
      circle.setAttribute("r", String(radius));
      circle.setAttribute("fill", "#000");
      circle.setAttribute("fill-opacity", "0");
      circle.setAttribute("pointer-events", "fill");
      circle.style.cursor = "move";
      svg.append(circle);
      return armHit(wrap(svg, annotation.x - radius, annotation.y - radius, radius * 2, radius * 2), index);
    }

    function renderMark(annotation) {
      if (annotation.type === "pen" || annotation.type === "highlight") return renderStroke(annotation);
      if (annotation.type === "rect" || annotation.type === "ellipse") return renderShape(annotation);
      if (annotation.type === "arrow") return renderArrow(annotation);
      if (annotation.type === "text") return renderText(annotation);
      if (annotation.type === "step") return renderStep(annotation);
      if (annotation.type === "blur") return renderBlur(annotation);
      return null;
    }

    function renderStroke(annotation) {
      const bounds = model.annotationBounds(measure, annotation);
      if (!bounds) return null;
      const svg = emptySvg(bounds.w, bounds.h);
      const poly = svgEl("polyline");
      poly.setAttribute("fill", "none");
      poly.setAttribute("stroke", annotation.color || "#e23b2f");
      poly.setAttribute("stroke-width", String(annotation.width || 4));
      poly.setAttribute("stroke-linecap", "round");
      poly.setAttribute("stroke-linejoin", "round");
      poly.setAttribute("stroke-opacity", String(model.strokeAlpha(annotation)));
      poly.setAttribute("points", (annotation.points || []).map((point) => `${point.x - bounds.x},${point.y - bounds.y}`).join(" "));
      svg.append(poly);
      return wrap(svg, bounds.x, bounds.y, bounds.w, bounds.h);
    }

    function renderShape(annotation) {
      const width = Number(annotation.width) || 4;
      const pad = width / 2;
      const w = Math.abs(Number(annotation.w) || 0);
      const h = Math.abs(Number(annotation.h) || 0);
      const svg = emptySvg(w + width, h + width);
      const node = svgEl(annotation.type === "ellipse" ? "ellipse" : "rect");
      node.setAttribute("fill", "none");
      node.setAttribute("stroke", annotation.color || "#e23b2f");
      node.setAttribute("stroke-width", String(width));
      node.setAttribute("stroke-opacity", String(model.strokeAlpha(annotation)));
      if (annotation.type === "ellipse") {
        node.setAttribute("cx", String(pad + w / 2));
        node.setAttribute("cy", String(pad + h / 2));
        node.setAttribute("rx", String(Math.max(0.5, w / 2)));
        node.setAttribute("ry", String(Math.max(0.5, h / 2)));
      } else {
        node.setAttribute("x", String(pad));
        node.setAttribute("y", String(pad));
        node.setAttribute("width", String(w));
        node.setAttribute("height", String(h));
      }
      svg.append(node);
      const left = (Number(annotation.w) < 0 ? annotation.x + annotation.w : annotation.x) - pad;
      const top = (Number(annotation.h) < 0 ? annotation.y + annotation.h : annotation.y) - pad;
      return wrap(svg, left, top, w + width, h + width);
    }

    function renderArrow(annotation) {
      const bounds = model.annotationBounds(measure, annotation);
      if (!bounds) return null;
      const width = Number(annotation.width) || 4;
      const pad = width;
      const svg = emptySvg(bounds.w + pad * 2, bounds.h + pad * 2);
      const originX = bounds.x - pad;
      const originY = bounds.y - pad;
      const shaft = model.arrowShaftEnd(annotation.x1, annotation.y1, annotation.x2, annotation.y2, width);
      const head = model.arrowHead(annotation.x1, annotation.y1, annotation.x2, annotation.y2, width);
      const line = svgEl("line");
      line.setAttribute("x1", String(annotation.x1 - originX));
      line.setAttribute("y1", String(annotation.y1 - originY));
      line.setAttribute("x2", String(shaft.x - originX));
      line.setAttribute("y2", String(shaft.y - originY));
      line.setAttribute("stroke", annotation.color || "#e23b2f");
      line.setAttribute("stroke-width", String(width));
      line.setAttribute("stroke-linecap", "round");
      line.setAttribute("stroke-opacity", String(model.strokeAlpha(annotation)));
      const polygon = svgEl("polygon");
      polygon.setAttribute("points", head.map((point) => `${point.x - originX},${point.y - originY}`).join(" "));
      polygon.setAttribute("fill", annotation.color || "#e23b2f");
      polygon.setAttribute("fill-opacity", String(model.strokeAlpha(annotation)));
      svg.append(line, polygon);
      return wrap(svg, originX, originY, bounds.w + pad * 2, bounds.h + pad * 2);
    }

    function renderText(annotation) {
      const bounds = model.textBounds(measure, annotation);
      const size = Number(annotation.size) || 28;
      const el = document.createElement("div");
      place(el, bounds.x, bounds.y, bounds.w, bounds.h);
      el.style.boxSizing = "border-box";
      el.style.padding = "2px 4px";
      el.style.overflow = "hidden";
      el.style.whiteSpace = "pre";
      el.style.lineHeight = "1.2";
      el.style.font = `${size}px ${model.cssFontFamily(annotation.font)}`;
      el.style.color = annotation.color || "#111111";
      const background = model.textBackgroundColor(annotation);
      el.style.background = background || "transparent";
      el.style.textShadow = annotation.shadow
        ? `0 1px ${Number(annotation.shadowBlur) || 0}px rgba(0,0,0,.65)`
        : "none";
      el.textContent = annotation.text || "";
      return el;
    }

    function renderStep(annotation) {
      const radius = model.stepRadius(annotation);
      const el = document.createElement("div");
      place(el, annotation.x - radius, annotation.y - radius, radius * 2, radius * 2);
      el.style.borderRadius = "50%";
      el.style.background = annotation.fill || "#e23b2f";
      el.style.color = annotation.color || "#ffffff";
      el.style.display = "grid";
      el.style.placeItems = "center";
      const label = String(Math.max(1, Math.round(Number(annotation.n) || 1)));
      const digits = label.length;
      const scale = digits <= 1 ? 0.95 : digits === 2 ? 0.78 : 0.62;
      el.style.font = `700 ${Math.max(8, radius * scale)}px Arial, sans-serif`;
      el.textContent = label;
      return el;
    }

    function renderBlur(annotation) {
      const el = document.createElement("div");
      place(el, annotation.x, annotation.y, annotation.w, annotation.h);
      const radius = Math.max(2, Number(annotation.radius) || 8);
      el.style.backdropFilter = `blur(${radius}px)`;
      el.style.webkitBackdropFilter = `blur(${radius}px)`;
      el.style.background = "rgba(255,255,255,.08)";
      return el;
    }

    function outlineFor(annotation, kind) {
      const bounds = model.annotationBounds(measure, annotation);
      if (!bounds) return null;
      const pad = 3;
      const el = document.createElement("div");
      place(el, bounds.x - pad, bounds.y - pad, bounds.w + pad * 2, bounds.h + pad * 2);
      el.style.boxSizing = "border-box";
      el.style.border = kind === "erase" ? "2px solid #e23b2f" : "1.5px dashed #1f6feb";
      return el;
    }

    function emptySvg(width, height) {
      const safeWidth = Math.max(1, Number(width) || 1);
      const safeHeight = Math.max(1, Number(height) || 1);
      const svg = svgEl("svg");
      svg.setAttribute("width", String(safeWidth));
      svg.setAttribute("height", String(safeHeight));
      svg.setAttribute("viewBox", `0 0 ${safeWidth} ${safeHeight}`);
      svg.style.display = "block";
      svg.style.overflow = "visible";
      return svg;
    }

    function wrap(svg, x, y, width, height) {
      const el = document.createElement("div");
      place(el, x, y, width, height);
      el.append(svg);
      return el;
    }

    function place(el, x, y, width, height) {
      el.style.position = "absolute";
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.width = `${Math.max(0, width)}px`;
      el.style.height = `${Math.max(0, height)}px`;
      el.style.pointerEvents = "none";
      return el;
    }
  }

  let onNavigate = () => {};
  window.addEventListener("felt-tip-navigate", () => onNavigate());

  function watchHistory(onChange) {
    document.documentElement.dataset.feltTipWatch = "1";
    onNavigate = onChange;
    return () => {
      delete document.documentElement.dataset.feltTipWatch;
      onNavigate = () => {};
    };
  }

  function dragPanel(handle) {
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button")) return;
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const rect = panel.getBoundingClientRect();
      const move = (ev) => {
        panel.style.left = `${rect.left + ev.clientX - startX}px`;
        panel.style.top = `${rect.top + ev.clientY - startY}px`;
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  function pagePoint(event) {
    return {
      x: event.clientX + window.scrollX,
      y: event.clientY + window.scrollY,
      clientX: event.clientX,
      clientY: event.clientY,
    };
  }

  function pointerDistance(point, origin) {
    return Math.hypot(point.x - origin.x, point.y - origin.y);
  }

  function iconElement(name) {
    const svg = svgEl("svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.75");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.innerHTML = ICONS[name] || "";
    return svg;
  }

  function svgEl(name) {
    return document.createElementNS(SVG_NS, name);
  }

  function field(label, ...nodes) {
    const wrap = document.createElement("div");
    wrap.className = "field";
    const title = document.createElement("span");
    title.textContent = label;
    wrap.append(title, ...nodes);
    return wrap;
  }

  function colorInput(value, fallback) {
    const input = document.createElement("input");
    input.type = "color";
    input.value = /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : fallback;
    return input;
  }

  function numberInput(value, min, max) {
    const input = document.createElement("input");
    input.type = "number";
    input.min = String(min);
    input.max = String(max);
    input.value = String(value);
    return input;
  }

  function rangeInput(value) {
    const input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = "100";
    input.value = String(value);
    return input;
  }

  function swatches(colors, input, onPick) {
    const row = document.createElement("div");
    row.className = "swatches";
    for (const [name, hex] of colors) {
      const button = document.createElement("button");
      button.type = "button";
      button.title = name;
      button.setAttribute("aria-label", name);
      button.dataset.color = hex;
      button.style.background = hex;
      button.addEventListener("click", () => {
        input.value = hex;
        markSwatches(row, hex);
        onPick();
      });
      row.append(button);
    }
    markSwatches(row, input.value);
    return row;
  }

  function markSwatches(row, value) {
    const current = String(value || "").toLowerCase();
    for (const button of row.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", button.dataset.color === current ? "true" : "false");
    }
  }

  function markSizes(row, value) {
    const current = String(value);
    for (const button of row.querySelectorAll("button")) {
      button.setAttribute("aria-pressed", button.dataset.size === current ? "true" : "false");
    }
  }

  function bindNumber(input, apply, start, end) {
    input.addEventListener("input", () => {
      apply();
      start();
    });
    input.addEventListener("change", () => {
      apply();
      end();
    });
  }

  function clamp(value, min, max) {
    const number = Math.round(Number(value));
    if (!Number.isFinite(number)) return NaN;
    return Math.min(max, Math.max(min, number));
  }

  function sameColor(left, right) {
    return String(left || "").toLowerCase() === String(right || "").toLowerCase();
  }

  function isField(target) {
    if (!target || !target.tagName) return false;
    return target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
  }
})();
