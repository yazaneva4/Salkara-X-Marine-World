/** Coalesce requests, reconcile while visible, and abort work on cleanup. */
export function startLiveRefresh(task: (signal: AbortSignal) => Promise<void>, options: {
  visible: () => boolean;
  online: () => boolean;
  intervalMs?: number;
}) {
  let stopped = false;
  let running = false;
  let queued = false;
  let controller: AbortController | null = null;
  async function refresh() {
    if (stopped || !options.visible() || !options.online()) return;
    if (running) { queued = true; return; }
    running = true;
    controller = new AbortController();
    const timeout = setTimeout(() => controller?.abort(), 10_000);
    try { await task(controller.signal); } catch { /* Retry on the next event or timer. */ }
    finally {
      clearTimeout(timeout);
      running = false;
      if (queued && !stopped) { queued = false; void refresh(); }
    }
  }
  const timer = setInterval(() => { void refresh(); }, options.intervalMs ?? 15_000);
  return { refresh, stop() { stopped = true; clearInterval(timer); controller?.abort(); } };
}
