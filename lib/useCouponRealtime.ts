"use client";

import { useEffect, useRef, useState } from "react";
import type { Coupon } from "./types";

const COUPON_REALTIME_CHANNEL = "salkara-marine-coupons";

type RealtimeState = "connecting" | "connected" | "reconnecting" | "unavailable";

type CouponSync = (coupons: Coupon[]) => void;

async function fetchCoupons(): Promise<Coupon[] | null> {
  const res = await fetch("/api/coupons", {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { coupons?: Coupon[] };
  return Array.isArray(data.coupons) ? data.coupons : null;
}

/**
 * Keeps a dashboard synchronized with the Blob-backed source of truth.
 * The browser talks to the local API for coupon data and loads the realtime
 * client SDK dynamically so the server-only Ably build is not parsed into
 * the Next.js client bundle.
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
    let realtime: import("ably").default | null = null;
    let channel: ReturnType<NonNullable<typeof realtime>["channels"]["get"]> | null = null;
    let connectionHandler: ((change: import("ably").Types.ConnectionStateChange) => void) | null = null;
    let messageHandler: (() => void) | null = null;

    const sync = async () => {
      try {
        const coupons = await fetchCoupons();
        if (!disposed && coupons) onSyncRef.current(coupons);
      } catch {
        // The next realtime event or reconnect will retry the sync.
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
        // Dynamic import keeps Ably out of the initial client module graph.
        const { default: Ably } = await import("ably");
        if (disposed) return;

        realtime = new Ably.Realtime({
          authUrl: "/api/realtime/auth",
          recover: (_, callback) => callback(true),
        });
        channel = realtime.channels.get(COUPON_REALTIME_CHANNEL);

        messageHandler = () => scheduleSync();
        connectionHandler = (change: import("ably").Types.ConnectionStateChange) => {
          if (disposed) return;
          if (change.current === "connected") {
            setState("connected");
            void sync();
          } else if (
            change.current === "disconnected" ||
            change.current === "connecting" ||
            change.current === "suspended"
          ) {
            setState("reconnecting");
          } else if (change.current === "failed") {
            setState("unavailable");
          }
        };

        channel.subscribe("coupon.changed", messageHandler).catch(() => {
          if (!disposed) setState("unavailable");
        });
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
