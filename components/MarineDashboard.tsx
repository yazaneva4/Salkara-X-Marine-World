"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import StatusBadge from "./StatusBadge";
import WhatsAppButton from "./WhatsAppButton";
import { couponUrl } from "@/lib/client";
import { contactSalkaraMessage } from "@/lib/whatsapp";
import type { Coupon } from "@/lib/types";

const SALKARA_WA = process.env.NEXT_PUBLIC_SALKARA_WHATSAPP || "";

export default function MarineDashboard({
  initialCoupons,
}: {
  initialCoupons: Coupon[];
}) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [lookup, setLookup] = useState("");
  const [found, setFound] = useState<Coupon | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [coupons, query]);

  async function find(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setLookupError(null);
    setFound(null);
    const code = lookup.trim();
    if (!code) {
      setBusy(false);
      return;
    }
    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || "Coupon not found");
        return;
      }
      setFound(data.coupon);
    } catch {
      setLookupError("Network error, please try again");
    } finally {
      setBusy(false);
    }
  }

  async function redeem(code: string) {
    setRowBusy(code);
    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(code)}/redeem-marine`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setCoupons((prev) => prev.map((c) => (c.code === code ? data.coupon : c)));
        setFound((f) => (f && f.code === code ? data.coupon : f));
      } else {
        alert(data.error || "Could not redeem coupon");
      }
    } finally {
      setRowBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Lookup / redeem */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Redeem a coupon</h2>
        <p className="mt-1 text-sm text-slate-500">
          Scan the QR code on the customer&apos;s coupon, or type the code below.
        </p>

        <form onSubmit={find} className="mt-4 flex flex-wrap gap-2">
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder="e.g. SALMAR-7KQ9ZP"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-3 font-mono text-sm uppercase focus:border-marine focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-marine px-5 py-3 text-sm font-bold text-white hover:bg-marine-light disabled:opacity-60"
          >
            {busy ? "…" : "Find"}
          </button>
        </form>

        {lookupError && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {lookupError}
          </div>
        )}

        {found && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-mono text-sm font-bold text-marine">
                  {found.code}
                </div>
                <div className="text-sm text-slate-600">{found.name}</div>
              </div>
              <StatusBadge status={found.status} />
            </div>

            <div className="mt-3">
              {found.status === "issued" ? (
                <button
                  onClick={() => redeem(found.code)}
                  disabled={rowBusy === found.code}
                  className="w-full rounded-lg bg-marine px-4 py-3 text-sm font-bold text-white hover:bg-marine-light disabled:opacity-60"
                >
                  {rowBusy === found.code
                    ? "Processing…"
                    : "✓ Give 10% off tickets & mark as used"}
                </button>
              ) : (
                <p className="text-sm text-slate-500">
                  Already redeemed at Marine World. Nothing more to do here.
                </p>
              )}
            </div>

            <div className="mt-3">
              <Link
                href={`/coupon/${found.code}`}
                className="text-xs font-semibold text-marine hover:underline"
              >
                Open full coupon →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Recent coupons */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-800">
            Coupons{" "}
            <span className="text-sm font-normal text-slate-400">
              ({coupons.length})
            </span>
          </h2>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code or name…"
            className="w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-marine focus:outline-none"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            No coupons found.
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
                  <div className="truncate text-sm text-slate-600">{c.name}</div>
                </div>
                {c.status === "issued" && (
                  <button
                    onClick={() => redeem(c.code)}
                    disabled={rowBusy === c.code}
                    className="rounded-lg bg-marine px-3 py-1.5 text-xs font-bold text-white hover:bg-marine-light disabled:opacity-60"
                  >
                    {rowBusy === c.code ? "…" : "10% off tickets"}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {SALKARA_WA && (
        <div className="text-center">
          <WhatsAppButton
            number={SALKARA_WA}
            message={contactSalkaraMessage()}
            label="Contact Salkara on WhatsApp"
            variant="outline"
          />
        </div>
      )}
    </div>
  );
}
