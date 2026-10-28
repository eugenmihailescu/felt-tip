import { SCRIPT_BLOCKED_MESSAGE, pageAllowsScripting } from "../lib/pages.js";
import { loadState, pageKey, pageRecord } from "../lib/storage.js";

const ports = new Map();
let injectQueue = Promise.resolve();

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "annotate") return;
  const tabId = port.sender?.tab?.id;
  if (tabId == null) return;
  ports.set(tabId, port);
  port.onDisconnect.addListener(() => {
    if (ports.get(tabId) === port) ports.delete(tabId);
  });
});

chrome.action.onClicked.addListener((tab) => {
  enqueueInject(() => toggle(tab)).catch((error) => {
    showMessage(error?.message || "Felt Tip could not open on this tab.");
  });
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "restore") return;
  const tabId = sender.tab?.id;
  if (tabId == null) return;
  if (sender.frameId != null && sender.frameId !== 0) return;
  const url = message.href || sender.url || sender.tab?.url || "";
  enqueueInject(() => restoreTab(tabId, url)).catch(() => {});
});

function enqueueInject(task) {
  const run = injectQueue.then(task, task);
  injectQueue = run.then(() => {}, () => {});
  return run;
}

async function toggle(tab) {
  if (!tab?.id) return;
  if (!pageAllowsScripting(tab.url || "")) {
    showMessage(SCRIPT_BLOCKED_MESSAGE);
    return;
  }
  await openAnnotator(tab.id, { restore: false });
}

async function restoreTab(tabId, url) {
  if (!pageAllowsScripting(url)) return;
  const state = await loadState();
  if (!pageRecord(state.pages, pageKey(url), state.lifetime)) return;
  await openAnnotator(tabId, { restore: true });
}

async function openAnnotator(tabId, { restore }) {
  const existing = ports.get(tabId);
  if (existing) {
    if (restore) return;
    try {
      existing.postMessage({ type: "toggle" });
      return;
    } catch {
      ports.delete(tabId);
    }
  }
  try {
    const [probe] = await chrome.scripting.executeScript({
      target: { tabId },
      func: (restoreOnly) => {
        if (globalThis.__feltTipActive) return true;
        globalThis.__feltTipRestore = restoreOnly === true;
        return false;
      },
      args: [restore],
    });
    if (probe?.result) {
      if (!restore) {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ["src/page/annotate.js"],
        });
      }
      return;
    }
    await chrome.scripting.executeScript({
      target: { tabId },
      world: "MAIN",
      files: ["src/page/history-hook.js"],
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/page/annotate.js"],
    });
  } catch (error) {
    if (restore) {
      console.error("Felt Tip could not restore marks", error);
      return;
    }
    showMessage(error?.message || SCRIPT_BLOCKED_MESSAGE);
  }
}

function showMessage(text) {
  const query = new URLSearchParams({ text });
  return chrome.windows.create({
    url: chrome.runtime.getURL(`src/message/message.html?${query}`),
    type: "popup",
    width: 440,
    height: 200,
    focused: true,
  });
}
