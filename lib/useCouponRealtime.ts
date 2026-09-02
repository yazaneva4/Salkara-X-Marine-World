"use client";

import { useEffect, useRef, useState } from "react";
import Ably from "ably";
import { COUPON_REALTIME_CHANNEL } from "./realtime";
import type { Coupon } from "./types";

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
 * Ably only carries an invalidation event; the actual coupon data is always
 * re-fetched through the authenticated API, so customer data is never sent
 * over the public realtime channel.
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

    const realtime = new Ably.Realtime({
      authUrl: "/api/realtime/auth",
      recover: (_, callback) => callback(true),
    });
    const channel = realtime.channels.get(COUPON_REALTIME_CHANNEL);

    const messageHandler = () => scheduleSync();
    const connectionHandler = (change: Ably.Types.ConnectionStateChange) => {
      if (disposed) return;
      if (change.current === "connected") {
        setState("connected");
        // A reconnect can span a period in which messages were missed, so
        // always reconcile with Blob after the connection becomes healthy.
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

    return () => {
      disposed = true;
      if (syncTimer) clearTimeout(syncTimer);
      channel.unsubscribe("coupon.changed", messageHandler);
      realtime.connection.off(connectionHandler);
      realtime.close();
    };
  }, []);

  return state;
}
