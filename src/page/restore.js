(() => {
  // A full load runs this once. A Next.js link stays in the same document
  // and only changes the address, so keep listening after the first check.
  const storeUrl = chrome.runtime.getURL("src/lib/storage.js");
  let storePromise = null;
  let requestedHref = "";

  function getStore() {
    storePromise ??= import(storeUrl);
    return storePromise;
  }

  function maybeRestore() {
    if (globalThis.__feltTipActive) return;
    const href = location.href;
    if (href === requestedHref) return;
    requestedHref = href;
    restoreHref(href);
  }

  async function restoreHref(href) {
    try {
      const store = await getStore();
      if (globalThis.__feltTipActive) return;
      if (location.href !== href) {
        requestedHref = "";
        maybeRestore();
        return;
      }
      const state = await store.loadState();
      if (globalThis.__feltTipActive) return;
      if (location.href !== href) {
        requestedHref = "";
        maybeRestore();
        return;
      }
      if (!store.pageRecord(state.pages, store.pageKey(href), state.lifetime)) return;
      askRestore();
    } catch {
      if (!globalThis.__feltTipActive && location.href === href) askRestore();
    }
  }

  window.addEventListener("felt-tip-navigate", maybeRestore);
  window.addEventListener("popstate", maybeRestore);
  window.navigation?.addEventListener("navigatesuccess", maybeRestore);
  const watchAddress = () => {
    const root = document.documentElement;
    if (!root || root.dataset.feltTipAddressWatch === "1") return;
    root.dataset.feltTipAddressWatch = "1";
    new MutationObserver(maybeRestore).observe(root, {
      attributes: true,
      attributeFilter: ["data-felt-tip-nav"],
    });
  };
  if (document.documentElement) watchAddress();
  else document.addEventListener("DOMContentLoaded", watchAddress, { once: true });
  maybeRestore();
})();

function askRestore() {
  if (globalThis.__feltTipActive) return;
  chrome.runtime.sendMessage({ type: "restore", href: location.href }, () => {
    void chrome.runtime.lastError;
  });
}
