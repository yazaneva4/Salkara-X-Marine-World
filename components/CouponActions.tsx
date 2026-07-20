"use client";

import React, { useState } from "react";
import WhatsAppButton from "./WhatsAppButton";
import { CheckIcon } from "./Icons";
import type { CouponStatus, Role } from "@/lib/types";
import {
  contactMarineMessage,
  contactSalkaraMessage,
  completedMessage,
  shareCouponMessage,
  customerCouponMessage,
} from "@/lib/whatsapp";

interface Props {
  code: string;
  name: string;
  validUntil: string;
  initialStatus: CouponStatus;
  marineUsedAt: string | null;
  salkaraUsedAt: string | null;
  role: Role | null;
  couponUrl: string;
  customerWhatsapp?: string; // only provided to signed-in staff
}

const SALKARA_WA = process.env.NEXT_PUBLIC_SALKARA_WHATSAPP || "";
const MARINE_WA = process.env.NEXT_PUBLIC_MARINE_WHATSAPP || "";

function fmt(d: string | null): string {
  if (!d) return "";
  const p = new Date(d);
  return Number.isNaN(p.getTime())
    ? d
    : p.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

export default function CouponActions({
  code,
  name,
  validUntil,
  initialStatus,
  marineUsedAt,
  salkaraUsedAt,
  role,
  couponUrl,
  customerWhatsapp,
}: Props) {
  const [status, setStatus] = useState<CouponStatus>(initialStatus);
  const [marineAt, setMarineAt] = useState<string | null>(marineUsedAt);
  const [salkaraAt, setSalkaraAt] = useState<string | null>(salkaraUsedAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function redeem(kind: "marine" | "salkara") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/coupons/${encodeURIComponent(code)}/redeem-${kind}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setStatus(data.coupon.status);
      setMarineAt(data.coupon.marineUsedAt);
      setSalkaraAt(data.coupon.salkaraUsedAt);
    } catch {
      setError("Network error, please try again");
    } finally {
      setBusy(false);
    }
  }

  const steps = [
    { label: "Issued at Salkara", done: true, at: null as string | null },
    { label: "Used at CISO Marine World", done: status !== "issued", at: marineAt },
    { label: "Food discount applied at Salkara", done: status === "completed", at: salkaraAt },
  ];

  return (
    <div className="space-y-4">
      {/* Progress timeline */}
      <ol className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                s.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
              }`}
            >
              {s.done ? <CheckIcon className="h-3 w-3" /> : <span className="text-[10px]">{i + 1}</span>}
            </span>
            <div>
              <div className={`text-sm font-medium ${s.done ? "text-slate-800" : "text-slate-400"}`}>
                {s.label}
              </div>
              {s.at && <div className="text-xs text-slate-400">{fmt(s.at)}</div>}
            </div>
          </li>
        ))}
      </ol>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Role-specific actions */}
      {role === "marine" && (
        <div className="rounded-xl border border-marine/30 bg-marine/5 p-4">
          <h3 className="mb-2 text-sm font-bold text-marine-dark">CISO Marine World</h3>
          {status === "issued" ? (
            <button
              onClick={() => redeem("marine")}
              disabled={busy}
              className="w-full rounded-lg bg-marine px-4 py-3 text-sm font-bold text-white hover:bg-marine-light disabled:opacity-60"
            >
              {busy ? "Processing…" : "✓ Give 10% off tickets & mark as used"}
            </button>
          ) : (
            <p className="text-sm text-slate-600">
              Already redeemed here{marineAt ? ` on ${fmt(marineAt)}` : ""}. The
              customer can now claim their food discount at Salkara.
            </p>
          )}
        </div>
      )}

      {role === "salkara" && (
        <div className="rounded-xl border border-salkara/30 bg-salkara/5 p-4">
          <h3 className="mb-2 text-sm font-bold text-salkara-dark">Salkara Restaurant</h3>
          {status === "issued" && (
            <p className="text-sm text-slate-600">
              This coupon has not been used at CISO Marine World yet. The food
              discount can only be applied after the customer visits Marine World.
            </p>
          )}
          {status === "marine_used" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                ✓ Used at Marine World{marineAt ? ` on ${fmt(marineAt)}` : ""}. You
                can now apply the 10% food discount.
              </p>
              <button
                onClick={() => redeem("salkara")}
                disabled={busy}
                className="w-full rounded-lg bg-salkara px-4 py-3 text-sm font-bold text-white hover:bg-salkara-light disabled:opacity-60"
              >
                {busy ? "Processing…" : "✓ Apply 10% food discount & complete"}
              </button>
            </div>
          )}
          {status === "completed" && (
            <div className="space-y-3">
              <p className="text-sm text-emerald-700">
                ✔ Completed — food discount applied{salkaraAt ? ` on ${fmt(salkaraAt)}` : ""}.
              </p>
              {customerWhatsapp && (
                <WhatsAppButton
                  number={customerWhatsapp}
                  message={completedMessage(name, code)}
                  label="Send thank-you to customer"
                  variant="solid"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Staff sharing tools */}
      {role && customerWhatsapp && status !== "completed" && (
        <div className="flex flex-wrap gap-2">
          <WhatsAppButton
            number={customerWhatsapp}
            message={customerCouponMessage(name, code, couponUrl, validUntil)}
            label="Send coupon to customer"
            variant="solid"
          />
          <WhatsAppButton
            number=""
            message={shareCouponMessage(code, couponUrl)}
            label="Share coupon"
            variant="outline"
          />
        </div>
      )}

      {/* Public / customer contact buttons */}
      {!role && (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-600">
            Show this coupon at the venue. Staff will scan the code to apply your
            discount. Questions? Message us:
          </p>
          <div className="flex flex-wrap gap-2">
            {MARINE_WA && (
              <WhatsAppButton
                number={MARINE_WA}
                message={contactMarineMessage(code)}
                label="WhatsApp Marine World"
                variant="outline"
              />
            )}
            {SALKARA_WA && (
              <WhatsAppButton
                number={SALKARA_WA}
                message={contactSalkaraMessage(code)}
                label="WhatsApp Salkara"
                variant="outline"
              />
            )}
            <WhatsAppButton
              number=""
              message={shareCouponMessage(code, couponUrl)}
              label="Share my coupon"
              variant="soft"
            />
          </div>
        </div>
      )}

      <button
        onClick={() => window.print()}
        className="no-print w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        🖨️ Print / Save as PDF
      </button>
    </div>
  );
}
