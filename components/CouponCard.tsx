"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { ForkKnifeIcon, TicketIcon, CalendarIcon, UsersIcon } from "./Icons";
import LogoImg from "./LogoImg";
import type { CouponStatus } from "@/lib/types";

function SalkaraWordmark() {
  return (
    <div className="px-2 py-1 text-center leading-none">
      <div className="text-xl font-extrabold tracking-tight text-salkara">Salkara</div>
      <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-widest text-slate-500">
        Family Restaurant
      </div>
    </div>
  );
}

function MarineWordmark() {
  return (
    <div className="px-2 py-1 text-center leading-none text-marine-navy">
      <div className="text-[8px] font-semibold uppercase tracking-widest text-marine">CISO</div>
      <div className="mt-0.5 text-lg font-extrabold tracking-tight">Marine World</div>
    </div>
  );
}

interface Props {
  code: string;
  name: string;
  validUntil: string;
  status: CouponStatus;
  whatsappMasked?: string;
  couponUrl: string;
}

function formatDate(d: string): string {
  if (!d) return "—";
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CouponCard({
  code,
  name,
  validUntil,
  status,
  whatsappMasked,
  couponUrl,
}: Props) {
  const marineUsed = status === "marine_used" || status === "completed";
  const completed = status === "completed";

  return (
    <div className="print-area ticket-frame mx-auto w-full max-w-2xl rounded-[28px] bg-slate-100 p-2 shadow-2xl sm:p-3">
    <div className="overflow-hidden rounded-2xl bg-marine-navy text-white ring-1 ring-black/20">
      {/* Top logo panel */}
      <div className="relative overflow-hidden bg-gradient-to-b from-cream to-white px-5 pb-4 pt-5 text-marine-navy">
        <div className="warm-glow pointer-events-none absolute inset-y-0 left-0 w-2/3" />
        <div className="ocean-glow pointer-events-none absolute inset-y-0 right-0 w-2/3" />
        <div className="relative flex items-center justify-center gap-4 sm:gap-6">
          {/* Salkara logo */}
          <LogoImg
            src="/logos/salkara.png"
            alt="Salkara Family Restaurant"
            className="h-16 w-auto object-contain drop-shadow-sm sm:h-20"
            fallback={<SalkaraWordmark />}
          />

          <span className="shrink-0 text-lg font-bold text-marine-navy/40">×</span>

          {/* Marine World logo */}
          <LogoImg
            src="/logos/marine.png"
            alt="CISO Marine World"
            className="h-16 w-auto object-contain drop-shadow-sm sm:h-20"
            fallback={<MarineWordmark />}
          />
        </div>
      </div>

      {/* Title band */}
      <div className="bg-gradient-to-b from-marine-navy to-marine-dark px-5 pb-5 pt-4 text-center">
        <div className="font-script text-4xl leading-none text-gold sm:text-5xl">
          Joint Holiday
        </div>
        <div className="mt-1 text-2xl font-extrabold uppercase tracking-wide sm:text-3xl">
          Discount Coupon
        </div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-sky-200">
          Enjoy great food &amp; amazing marine adventures!
        </div>

        {/* Two offers */}
        <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-xl bg-salkara px-4 py-3 text-left shadow-lg">
            <ForkKnifeIcon className="h-8 w-8 shrink-0 text-white/90" />
            <div>
              <div className="text-2xl font-extrabold leading-none">
                10% <span className="text-lg">OFF</span>
              </div>
              <div className="text-[11px] font-semibold leading-tight text-white/90">
                ON YOUR TOTAL FOOD BILL
                <br />
                AT SALKARA GROUP OF RESTAURANTS
              </div>
            </div>
          </div>

          <div className="mx-auto grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-white ring-1 ring-white/30">
            AND
          </div>

          <div className="flex flex-1 items-center gap-3 rounded-xl bg-marine px-4 py-3 text-left shadow-lg">
            <TicketIcon className="h-8 w-8 shrink-0 text-white/90" />
            <div>
              <div className="text-2xl font-extrabold leading-none">
                10% <span className="text-lg">OFF</span>
              </div>
              <div className="text-[11px] font-semibold leading-tight text-white/90">
                ON ENTRY TICKETS
                <br />
                AT CISO MARINE WORLD
              </div>
            </div>
          </div>
        </div>

        {/* Info row */}
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-left text-marine-navy">
            <UsersIcon className="h-6 w-6 shrink-0 text-salkara" />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Valid for
              </div>
              <div className="text-[11px] font-semibold leading-tight">
                Family, Friends &amp; Tour Groups
              </div>
            </div>
          </div>

          <div className="rounded-lg border-2 border-gold bg-marine-dark px-3 py-2 text-center">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gold">
              ★ Coupon Code ★
            </div>
            <div className="font-mono text-lg font-extrabold tracking-wider text-gold">
              {code}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-left text-marine-navy">
            <CalendarIcon className="h-6 w-6 shrink-0 text-marine" />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Offer valid until
              </div>
              <div className="text-[11px] font-semibold leading-tight">
                {formatDate(validUntil)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer + QR + stamp */}
      <div className="ticket-divider grid grid-cols-1 gap-4 bg-marine-dark px-5 py-5 sm:grid-cols-[auto,1fr,auto] sm:items-center">
        <div className="flex items-center justify-center">
          <div className="rounded-lg bg-white p-2">
            <QRCodeSVG value={couponUrl} size={92} level="M" includeMargin={false} />
          </div>
        </div>

        <div className="text-center sm:text-left">
          <div className="text-[9px] font-bold uppercase tracking-widest text-sky-200">
            Issued to
          </div>
          <div className="text-lg font-bold leading-tight">{name || "Guest"}</div>
          {whatsappMasked && (
            <div className="text-xs text-sky-100">WhatsApp: {whatsappMasked}</div>
          )}
          <p className="mt-1 text-[10px] leading-snug text-sky-100/80">
            Visit CISO Marine World and get your stamp, then return to Salkara to
            claim <span className="font-semibold text-gold">10% off</span> your food bill.
          </p>
        </div>

        {/* Stamp area */}
        <div className="relative mx-auto grid h-24 w-32 place-items-center rounded-lg border-2 border-dashed border-white/40 text-center">
          {marineUsed ? (
            <div className="stamp-in select-none rounded-md border-4 border-emerald-400 px-2 py-1 text-emerald-300">
              <div className="text-[11px] font-black uppercase leading-none tracking-wide">
                Redeemed
              </div>
              <div className="text-[8px] font-semibold uppercase tracking-wider">
                Marine World
              </div>
            </div>
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
              Stamp
              <br />
              Here
            </span>
          )}
        </div>
      </div>

      {/* Status banner */}
      {completed && (
        <div className="bg-emerald-600 px-5 py-2 text-center text-xs font-bold uppercase tracking-widest text-white">
          ✔ Completed — both discounts applied
        </div>
      )}

      {/* Terms */}
      <div className="bg-marine-navy px-5 py-4 text-[9px] leading-snug text-sky-100/70">
        <div className="mb-1 inline-block rounded bg-marine px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
          Terms &amp; Conditions
        </div>
        <ul className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
          <li>• Valid at participating Salkara Group restaurants and CISO Marine World.</li>
          <li>• One coupon per customer / family per visit.</li>
          <li>• Cannot be combined with any other promotion or discount.</li>
          <li>• Original or digital coupon must be presented before payment.</li>
          <li>• Not valid on public holidays unless otherwise announced.</li>
        </ul>
        <div className="mt-2 text-center font-script text-lg text-gold">
          Taste the Best, Discover the Ocean
        </div>
        <div className="mt-1 text-center text-[8px] font-semibold uppercase tracking-widest text-sky-200/50">
          Salkara Group of Restaurants ★ CISO Marine World
        </div>
      </div>
    </div>
    </div>
  );
}
