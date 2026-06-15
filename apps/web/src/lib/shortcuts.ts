export type AppShortcutKey =
  | "create-dispute"
  | "focus-search"
  | "vote-now"
  | "toggle-my-cases"
  | "clear-filters"
  | "filter-active"
  | "filter-my-pending";

export const APP_SHORTCUT_EVENT = "solutiva-shortcut";

export function dispatchAppShortcut(key: AppShortcutKey) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(APP_SHORTCUT_EVENT, { detail: { key } }));
}

export function onAppShortcut(key: AppShortcutKey, handler: () => void) {
  if (typeof window === "undefined") return () => {};

  function listener(event: Event) {
    const custom = event as CustomEvent<{ key: AppShortcutKey }>;
    if (custom.detail?.key === key) handler();
  }

  window.addEventListener(APP_SHORTCUT_EVENT, listener);
  return () => window.removeEventListener(APP_SHORTCUT_EVENT, listener);
}
