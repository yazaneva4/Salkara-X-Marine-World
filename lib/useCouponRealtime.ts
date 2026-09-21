"use client";

import { useEffect, useRef, useState } from "react";
import type { Coupon, CouponStatus } from "./types";

const COUPON_REALTIME_CHANNEL = "salkara-marine-coupons";
const ABLY_BROWSER_SRC = "https://cdn.ably.com/lib/ably.min-2.js";
const FALLBACK_SYNC_MS = 15_000;

export type RealtimeState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "unavailable";
type CouponSync = (coupons: Coupon[]) => void;
export type CouponLiveStatus = {
  status: CouponStatus;
  marineUsedAt: string | null;
  salkaraUsedAt: string | null;
};

type AblyBrowser = {
  Realtime: new (options: {
    authUrl: string;
    recover: (lastConnectionDetails: unknown, callback: (shouldRecover: boolean) => void) => void;
  }) => any;
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

function couponChannel(code: string): string {
  return `salkara-marine-coupon:${code.trim().toUpperCase()}`;
}

function useRealtimeInvalidation(
  channelName: string,
  authUrl: string,
  onInvalidate: () => void | Promise<void>
): RealtimeState {
  const onInvalidateRef = useRef(onInvalidate);
  const [state, setState] = useState<RealtimeState>("connecting");

  useEffect(() => {
    onInvalidateRef.current = onInvalidate;
  }, [onInvalidate]);

  useEffect(() => {
    let disposed = false;
    let syncTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setInterval> | null = null;
    let realtime: any = null;
    let channel: any = null;
    let connectionHandler: ((change: { current: string }) => void) | null = null;
    let messageHandler: (() => void) | null = null;

    const runSync = () => {
      if (!disposed) void onInvalidateRef.current();
    };

    const scheduleSync = () => {
      if (syncTimer) clearTimeout(syncTimer);
      syncTimer = setTimeout(() => {
        syncTimer = null;
        runSync();
      }, 75);
    };

    const startFallback = () => {
      if (!fallbackTimer) {
        fallbackTimer = setInterval(runSync, FALLBACK_SYNC_MS);
      }
    };

    const stopFallback = () => {
      if (fallbackTimer) clearInterval(fallbackTimer);
      fallbackTimer = null;
    };

    const handleResume = () => {
      if (document.visibilityState === "visible") scheduleSync();
    };

    const startRealtime = async () => {
      try {
        const Ably = await loadAblyBrowser();
        if (disposed) return;

        realtime = new Ably.Realtime({
          authUrl,
          recover: (_, callback) => callback(true),
        });
        channel = realtime.channels.get(channelName);
        messageHandler = scheduleSync;
        connectionHandler = (change) => {
          if (disposed) return;
          if (change.current === "connected") {
            setState("connected");
            stopFallback();
            scheduleSync();
          } else if (["disconnected", "connecting", "suspended"].includes(change.current)) {
            setState("reconnecting");
            startFallback();
          } else if (["failed", "closed"].includes(change.current)) {
            setState("unavailable");
            startFallback();
          }
        };

        // Listen before subscribing so a fast connection cannot transition to
        // connected before the handler is registered.
        realtime.connection.on(connectionHandler);
        await channel.subscribe("coupon.changed", messageHandler);
        if (realtime.connection.state === "connected") {
          setState("connected");
          stopFallback();
          scheduleSync();
        }
      } catch {
        if (!disposed) {
          setState("unavailable");
          startFallback();
        }
      }
    };

    window.addEventListener("online", scheduleSync);
    document.addEventListener("visibilitychange", handleResume);
    scheduleSync();
    void startRealtime();

    return () => {
      disposed = true;
      if (syncTimer) clearTimeout(syncTimer);
      stopFallback();
      window.removeEventListener("online", scheduleSync);
      document.removeEventListener("visibilitychange", handleResume);
      if (channel && messageHandler) channel.unsubscribe("coupon.changed", messageHandler);
      if (realtime && connectionHandler) realtime.connection.off(connectionHandler);
      realtime?.close();
    };
  }, [authUrl, channelName]);

  return state;
}

/**
 * Keeps dashboards synchronized with the Blob-backed source of truth.
 * Realtime only carries an invalidation event; coupon data is re-fetched from
 * the authenticated API. The Node/server Ably package is never imported by
 * this client hook, preventing it from entering the Next.js client bundle.
 */
export function useCouponRealtime(onSync: CouponSync): RealtimeState {
  const sync = async () => {
    try {
      const coupons = await fetchCoupons();
      if (coupons) onSync(coupons);
    } catch {
      // Realtime reconnects or the fallback sync will retry.
    }
  };

  return useRealtimeInvalidation(COUPON_REALTIME_CHANNEL, "/api/realtime/auth", sync);
}

export function useCouponStatusRealtime(
  code: string,
  onSync: (coupon: CouponLiveStatus) => void
): RealtimeState {
  const normalizedCode = code.trim().toUpperCase();
  const sync = async () => {
    try {
      const res = await fetch(
        `/api/coupons/${encodeURIComponent(normalizedCode)}/public`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = (await res.json()) as { coupon?: CouponLiveStatus };
      if (data.coupon) onSync(data.coupon);
    } catch {
      // Realtime reconnects or the fallback sync will retry.
    }
  };

  return useRealtimeInvalidation(
    couponChannel(normalizedCode),
    `/api/realtime/auth?code=${encodeURIComponent(normalizedCode)}`,
    sync
  );
}
