(() => {
  // Next.js calls history.pushState in the page's own JavaScript world.
  // A wrapper installed anywhere else never sees that call.
  if (globalThis.__feltTipHistoryHook) return;
  globalThis.__feltTipHistoryHook = true;
  const notify = () => {
    const root = document.documentElement;
    if (root) root.dataset.feltTipNav = String(Date.now());
    window.dispatchEvent(new Event("felt-tip-navigate"));
  };
  const push = history.pushState;
  const replace = history.replaceState;
  history.pushState = function (...args) {
    const result = push.apply(this, args);
    notify();
    return result;
  };
  history.replaceState = function (...args) {
    const result = replace.apply(this, args);
    notify();
    return result;
  };
  window.addEventListener("popstate", notify);
})();
