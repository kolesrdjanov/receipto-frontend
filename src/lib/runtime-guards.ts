// Guards for production-only crashes caused by environment differences.
// This file should have *no* imports to avoid introducing cycles.

export function applyRuntimeGuards() {
  try {
    const g = globalThis as unknown as Record<string, unknown>

    // Some injected scripts/extensions assume a global `Activity` object exists.
    // If they run before our app, they may crash the page.
    if (g.Activity === undefined) {
      g.Activity = {}
    }
  } catch {
    // ignore
  }
}
