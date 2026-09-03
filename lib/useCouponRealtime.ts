"use client";

import { useEffect, useRef, useState } from "react";
import type { Coupon } from "./types";

const COUPON_REALTIME_CHANNEL = "salkara-marine-coupons";
const ABLY_BROWSER_SRC = "https://cdn.ably.com/lib/ably.min-2.js";

type RealtimeState = "connecting" | "connected" | "reconnecting" | "unavailable";
type CouponSync = (coupons: Coupon[]) => void;

type AblyBrowser = {
  Realtime: new (options: {
    authUrl: string;
    recover: (lastConnectionDetails: unknown, callback: (shouldRecover: boolean) => void) => void;
  }) => {
    channels: { get: (name: string) => { subscribe: (event: string, handler: () => void) => Promise<void> | void; unsubscribe: (event: string, handler: () => void) => void } };
    connection: { on: (handler: (change: { current: string }) => void) => void; off: (handler: (change: { current: string }) => void) => void };
    close: () => void;
  };
};

declare global {
  interface Window {
    Ably?: AblyBrowser;
  }
}

async function fetchCoupons(): Promise<Coupon[] | null> {
  const res = await fetch("/api/coupons", {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { coupons?: Coupon[] };
  return Array.isArray(data.coupons) ? data.coupons : null;
}

function loadAblyBrowser(): Promise<AblyBrowser> {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser only"));
  if (window.Ably) return Promise.resolve(window.Ably);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${ABLY_BROWSER_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => window.Ably ? resolve(window.Ably) : reject(new Error("Ably failed to load")), { once: true });
      existing.addEventListener("error", () => reject(new Error("Ably failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = ABLY_BROWSER_SRC;
    script.async = true;
    script.onload = () => window.Ably ? resolve(window.Ably) : reject(new Error("Ably failed to initialize"));
    script.onerror = () => reject(new Error("Ably failed to load"));
    document.head.appendChild(script);
  });
}

/**
 * Keeps dashboards synchronized with the Blob-backed source of truth.
 * Realtime only carries an invalidation event; coupon data is re-fetched from
 * the authenticated API. The browser SDK is loaded from Ably's browser CDN
 * so the Node/server Ably package never enters the Next.js client bundle.
 */
export function useCouponRealtime(onSync: CouponSync): RealtimeState {
  const onSyncRef = useRef(onSync);
  const [state, setState] = useState<RealtimeState>("connecting");

  useEffect(() => {
    onSyncRef.current = onSync;
  }, [onSync]);

  useEffect(() => {
    let disposed = false;
    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    let realtime: AblyBrowser["Realtime"] extends new (...args: any[]) => infer R ? R : never;
    let channel: ReturnType<NonNullable<typeof realtime> extends infer R ? R extends { channels: { get: (...args: any[]) => infer C } } ? R["channels"]["get"] : never : never> | null = null;
    let connectionHandler: ((change: { current: string }) => void) | null = null;
    let messageHandler: (() => void) | null = null;

    const sync = async () => {
      try {
        const coupons = await fetchCoupons();
        if (!disposed && coupons) onSyncRef.current(coupons);
      } catch {
        // Realtime reconnects or the next event will retry the sync.
      }
    };

    const scheduleSync = () => {
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        syncTimer = null;
        void sync();
      }, 75);
    };

    const startRealtime = async () => {
      try {
        const Ably = await loadAblyBrowser();
        if (disposed) return;

        realtime = new Ably.Realtime({
          authUrl: "/api/realtime/auth",
          recover: (_, callback) => callback(true),
        });
        channel = realtime.channels.get(COUPON_REALTIME_CHANNEL);

        messageHandler = () => scheduleSync();
        connectionHandler = (change) => {
          if (disposed) return;
          if (change.current === "connected") {
            setState("connected");
            void sync();
          } else if (["disconnected", "connecting", "suspended"].includes(change.current)) {
            setState("reconnecting");
          } else if (change.current === "failed") {
            setState("unavailable");
          }
        };

        await channel.subscribe("coupon.changed", messageHandler);
        realtime.connection.on(connectionHandler);
      } catch {
        if (!disposed) setState("unavailable");
      }
    };

    void sync();
    void startRealtime();

    return () => {
      disposed = true;
      if (syncTimer) clearTimeout(syncTimer);
      if (channel && messageHandler) channel.unsubscribe("coupon.changed", messageHandler);
      if (realtime && connectionHandler) realtime.connection.off(connectionHandler);
      realtime?.close();
    };
  }, []);

  return state;
}
