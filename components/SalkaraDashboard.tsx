"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import WhatsAppButton from "./WhatsAppButton";
import { couponUrl, defaultValidUntil } from "@/lib/client";
import { customerCouponMessage, completedMessage } from "@/lib/whatsapp";
import { useCouponRealtime } from "@/lib/useCouponRealtime";
import type { Coupon } from "@/lib/types";

export default function SalkaraDashboard({
  initialCoupons,
}: {
  initialCoupons: Coupon[];
}) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [validUntil, setValidUntil] = useState(defaultValidUntil());
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justIssued, setJustIssued] = useState<Coupon | null>(null);
  const [query, setQuery] = useState("");
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const syncCoupons = useCallback((nextCoupons: Coupon[]) => {
    setCoupons(nextCoupons);
  }, []);
  const realtimeState = useCouponRealtime(syncCoupons);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.whatsapp.includes(q)
    );
  }, [coupons, query]);

  async function issue(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setJustIssued(null);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp, validUntil, notes }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not issue coupon");
        return;
      }
      setCoupons((prev) => [data.coupon, ...prev.filter((c) => c.code !== data.coupon.code)]);
      setJustIssued(data.coupon);
      setName("");
      setWhatsapp("");
      setNotes("");
    } catch {
      setError("Network error, please try again");
    } finally {
      setBusy(false);
    }
  }

  async function applyFoodDiscount(code: string) {
    setRowBusy(code);
    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(code)}/redeem-salkara`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setCoupons((prev) => prev.map((c) => (c.code === code ? data.coupon : c)));
      } else {
        alert(data.error || "Could not apply discount");
      }
    } finally {
      setRowBusy(null);
    }
  }

  const realtimeLabel =
    realtimeState === "connected"
      ? "Live"
      : realtimeState === "reconnecting"
        ? "Reconnecting…"
        : realtimeState === "connecting"
          ? "Connecting…"
          : "Offline";

  return (
    <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
      {/* Issue form */}
      <section>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Issue a new coupon</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter the customer&apos;s details to create their joint discount coupon.
          </p>

          <form onSubmit={issue} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Customer name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-salkara focus:outline-none"
                placeholder="e.g. Ahmed Al-Fahad"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                WhatsApp number (with country code)
              </label>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                inputMode="tel"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-salkara focus:outline-none"
                placeholder="e.g. 9665XXXXXXXX"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Valid until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-salkara focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notes (optional)
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-salkara focus:outline-none"
                placeholder="e.g. Tour group of 6"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-salkara px-4 py-3 text-sm font-bold text-white hover:bg-salkara-light disabled:opacity-60"
            >
              {busy ? "Issuing…" : "🎟️ Issue coupon"}
            </button>
          </form>
        </div>

        {justIssued && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="text-sm font-bold text-emerald-800">
              ✔ Coupon {justIssued.code} created for {justIssued.name}
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              Send it to the customer on WhatsApp, or open it to print.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <WhatsAppButton
                number={justIssued.whatsapp}
                message={customerCouponMessage(
                  justIssued.name,
                  justIssued.code,
                  couponUrl(justIssued.code),
                  justIssued.validUntil
                )}
                label="Send to customer"
              />
              <Link
                href={`/coupon/${justIssued.code}`}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Open coupon →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Coupon list */}
      <section>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">
                All coupons{" "}
                <span className="text-sm font-normal text-slate-400">({coupons.length})</span>
              </h2>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  realtimeState === "connected"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {realtimeLabel}
              </span>
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code, name or number…"
              className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marine focus:outline-none"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No coupons yet. Issue your first one on the left.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <div key={c.code} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/coupon/${c.code}`}
                        className="font-mono text-sm font-bold text-marine hover:underline"
                      >
                        {c.code}
                      </Link>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="truncate text-sm text-slate-600">
                      {c.name} · {c.whatsapp}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.status === "marine_used" && (
                      <button
                        onClick={() => applyFoodDiscount(c.code)}
                        disabled={rowBusy === c.code}
                        className="rounded-lg bg-salkara px-3 py-1.5 text-xs font-bold text-white hover:bg-salkara-light disabled:opacity-60"
                      >
                        {rowBusy === c.code ? "…" : "Apply 10% food"}
                      </button>
                    )}
                    {c.status === "completed" ? (
                      <WhatsAppButton
                        number={c.whatsapp}
                        message={completedMessage(c.name, c.code)}
                        label="Thank you"
                        variant="soft"
                        size="sm"
                      />
                    ) : (
                      <WhatsAppButton
                        number={c.whatsapp}
                        message={customerCouponMessage(
                          c.name,
                          c.code,
                          couponUrl(c.code),
                          c.validUntil
                        )}
                        label="Send"
                        variant="soft"
                        size="sm"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
