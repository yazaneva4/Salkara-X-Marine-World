"use client";

import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ForkKnifeIcon,
  TicketIcon,
  CalendarIcon,
  UsersIcon,
  StampIcon,
} from "./Icons";
import LogoImg from "./LogoImg";
import type { CouponStatus } from "@/lib/types";

// If a poster artwork is uploaded to /public as coupon-template.(png|jpg|…),
// the coupon renders that exact image instead of the coded recreation below,
// giving a pixel-perfect match to the printed design.
const TEMPLATE_CANDIDATES = [
  "/coupon-template.png",
  "/coupon-template.jpg",
  "/coupon-template.jpeg",
  "/coupon-template.webp",
];

/** Resolve the first coupon-template image that actually loads (or null). */
function useCouponTemplate(): string | null | undefined {
  const [src, setSrc] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    let i = 0;
    const tryNext = () => {
      if (!active) return;
      if (i >= TEMPLATE_CANDIDATES.length) {
        setSrc(null);
        return;
      }
      const candidate = TEMPLATE_CANDIDATES[i++];
      const img = new window.Image();
      img.onload = () => active && setSrc(candidate);
      img.onerror = () => tryNext();
      img.src = candidate;
    };
    tryNext();
    return () => {
      active = false;
    };
  }, []);
  return src;
}

// Google Maps search links (by business name) so the "Location" QR codes are
// functional even without exact coordinates on file. Swap these for precise
// Google Maps place links once available.
const SALKARA_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=Salkara+Group+of+Restaurants+Saudi+Arabia";
const MARINE_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=CISO+Marine+World+Saudi+Arabia";

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

function LocationQr({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-1"
    >
      <div className="rounded-md bg-white p-1">
        <QRCodeSVG value={url} size={40} level="L" includeMargin={false} />
      </div>
      <span className="rounded-sm bg-white/15 px-1.5 py-0.5 text-center text-[7px] font-semibold uppercase leading-none tracking-wider text-white/70">
        {label}
      </span>
    </a>
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
  const templateSrc = useCouponTemplate();

  // When the poster artwork is uploaded, show it exactly as designed.
  if (templateSrc) {
    return (
      <div className="print-area mx-auto w-full max-w-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={templateSrc}
          alt="Salkara x CISO Marine World — Joint Holiday Discount Coupon"
          className="h-auto w-full rounded-xl shadow-2xl"
        />
      </div>
    );
  }

  return (
    <div className="print-area mx-auto w-full max-w-2xl rounded-[28px] bg-white p-2 shadow-2xl sm:p-3">
    <div className="overflow-hidden rounded-2xl bg-white text-marine-navy ring-1 ring-black/10">
      {/* Photo header: warm restaurant scene left, ocean scene right, with a
          white curved logo panel in the centre — matching the reference. */}
      <div className="relative h-28 sm:h-32">
        <div className="scene-food absolute inset-y-0 left-0 w-1/2" />
        <div className="scene-ocean absolute inset-y-0 right-0 w-1/2" />

        <div className="absolute left-1/2 top-0 flex h-full w-[78%] -translate-x-1/2 items-center justify-center gap-3 rounded-b-[44px] bg-white px-4 shadow-lg sm:gap-5">
          {/* Salkara logo — mix-blend-multiply drops its white background */}
          <div className="text-center leading-none">
            <LogoImg
              src="/logos/salkara.png"
              alt="Salkara Group of Restaurants"
              className="mx-auto h-14 w-auto object-contain mix-blend-multiply sm:h-[4.5rem]"
              fallback={<SalkaraWordmark />}
            />
            <div className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.2em] text-slate-700">
              Group of Restaurants
            </div>
            <div className="text-[6px] font-semibold uppercase tracking-[0.25em] text-salkara">
              Saudi Arabia
            </div>
          </div>

          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-marine-navy text-sm font-bold text-white">
            ×
          </span>

          {/* Marine World logo — its source file has an opaque black
              background, so it's presented as a soft rounded badge */}
          <LogoImg
            src="/logos/marine.png"
            alt="CISO Marine World"
            className="h-14 w-auto rounded-xl object-contain shadow-md sm:h-[4.5rem]"
            fallback={<MarineWordmark />}
          />
        </div>
      </div>

      {/* Title block on white */}
      <div className="bg-white px-5 pt-4 text-center">
        <div className="font-script text-4xl leading-none text-marine-navy sm:text-5xl">
          <span className="mr-2 align-middle text-xl text-gold">✦</span>
          Joint Holiday
          <span className="ml-2 align-middle text-xl text-gold">✦</span>
        </div>

        <div className="ribbon mx-auto mt-2 w-fit bg-gradient-to-b from-marine-navy to-marine-dark px-10 py-1.5 text-2xl font-extrabold uppercase tracking-wide text-white sm:px-14 sm:text-3xl">
          Discount Coupon
        </div>

        <div className="mt-2 text-[11px] font-bold uppercase tracking-wider text-marine-navy">
          Enjoy great food &amp; amazing marine adventures!
        </div>

        {/* Two offer pills */}
        <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 rounded-full bg-gradient-to-b from-salkara-light to-salkara-dark px-4 py-3 text-left text-white shadow-lg">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-white/80">
              <ForkKnifeIcon className="h-6 w-6 text-white" />
            </span>
            <div>
              <div className="text-2xl font-extrabold leading-none">
                10% <span className="text-lg">OFF</span>
              </div>
              <div className="text-[10px] font-semibold leading-tight text-white/95">
                ON YOUR TOTAL FOOD BILL
              </div>
              <div className="text-[10px] font-bold leading-tight text-gold">
                AT SALKARA GROUP OF RESTAURANTS
              </div>
            </div>
          </div>

          <div className="mx-auto grid h-10 w-10 shrink-0 place-items-center rounded-full bg-marine-navy text-xs font-bold text-white shadow-md">
            AND
          </div>

          <div className="flex flex-1 items-center justify-between gap-3 rounded-full border-2 border-marine-navy bg-white px-4 py-3 text-left text-marine-navy shadow-lg">
            <div>
              <div className="text-2xl font-extrabold leading-none">
                10% <span className="text-lg">OFF</span>
              </div>
              <div className="text-[10px] font-semibold leading-tight">
                ON ENTRY TICKETS
              </div>
              <div className="text-[10px] font-bold leading-tight text-marine">
                AT CISO MARINE WORLD
              </div>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-marine-navy">
              <TicketIcon className="h-6 w-6 text-white" />
            </span>
          </div>
        </div>

        {/* Info row */}
        <div className="grid grid-cols-1 gap-2 py-4 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left shadow-sm">
            <UsersIcon className="h-6 w-6 shrink-0 text-salkara" />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Valid for:
              </div>
              <div className="text-[11px] font-semibold leading-tight">
                Family, Friends &amp; Tour Groups
              </div>
            </div>
          </div>

          <div className="rounded-lg border-2 border-dashed border-gold bg-marine-navy px-3 py-1.5 text-center">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white">
              Coupon Code
            </div>
            <div className="mt-0.5 rounded bg-cream px-2 font-mono text-lg font-extrabold tracking-wider text-marine-navy">
              {code}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left shadow-sm">
            <CalendarIcon className="h-6 w-6 shrink-0 text-marine" />
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Offer valid until:
              </div>
              <div className="text-[11px] font-semibold leading-tight">
                {formatDate(validUntil)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navy bottom: locations + stamp instruction + stamp box + website QR */}
      <div className="bg-marine-navy text-white">
        <div className="grid grid-cols-1 items-center gap-4 px-5 py-4 sm:grid-cols-[auto,1fr,auto,auto]">
          {/* Location QR codes */}
          <div className="flex items-start justify-center gap-3">
            <LocationQr label="Location" url={SALKARA_MAPS_URL} />
            <LocationQr label="Location" url={MARINE_MAPS_URL} />
          </div>

          {/* Stamp instruction */}
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="hidden h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-marine-navy sm:grid">
              <StampIcon className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[11px] font-bold leading-snug">
                Please visit the Marine World and make sure stamp on beside and
                return back us get{" "}
                <span className="text-gold">10% discount</span> from Salkara.
              </p>
              <p className="mt-1 text-[9px] leading-none text-sky-100/70">
                Issued to <span className="font-semibold text-white">{name || "Guest"}</span>
                {whatsappMasked ? ` · WhatsApp: ${whatsappMasked}` : ""}
              </p>
            </div>
          </div>

          {/* Stamp area */}
          <div className="relative mx-auto grid h-20 w-36 place-items-center rounded-xl bg-white text-center shadow-inner">
            {marineUsed ? (
              <div className="stamp-in select-none rounded-md border-4 border-emerald-500 px-2 py-1 text-emerald-600">
                <div className="text-[11px] font-black uppercase leading-none tracking-wide">
                  Redeemed
                </div>
                <div className="text-[8px] font-semibold uppercase tracking-wider">
                  Marine World
                </div>
              </div>
            ) : (
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-300">
                Stamp
                <br />
                Here
              </span>
            )}
          </div>

          {/* Coupon QR */}
          <div className="flex flex-col items-center gap-1">
            <div className="rounded-lg bg-white p-1.5">
              <QRCodeSVG value={couponUrl} size={72} level="M" includeMargin={false} />
            </div>
            <span className="text-center text-[7px] font-bold uppercase leading-tight tracking-wider text-white/80">
              Scan to visit
              <br />
              our website
            </span>
          </div>
        </div>

        {/* Status banner */}
        {completed && (
          <div className="bg-emerald-600 px-5 py-2 text-center text-xs font-bold uppercase tracking-widest text-white">
            ✔ Completed — both discounts applied
          </div>
        )}

        {/* Terms */}
        <div className="px-5 pb-4 text-[9px] leading-snug text-sky-100/80">
          <div className="mb-1.5 inline-block rounded bg-marine px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            Terms &amp; Conditions
          </div>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-3">
            <li>• Valid at participating Salkara Group restaurants and CISO Marine World.</li>
            <li>• Cannot be combined with any other promotion or discount.</li>
            <li>• Not valid on public holidays unless otherwise announced.</li>
            <li>• One coupon per customer / family per visit.</li>
            <li>• Original or digital coupon must be presented before payment.</li>
          </ul>
          <div className="mt-2 text-center font-script text-lg text-white">
            <span className="mr-2 align-middle text-[10px] text-sky-200/70">〜〜</span>
            Taste the Best, Discover the Ocean
            <span className="ml-2 align-middle text-[10px] text-sky-200/70">〜〜</span>
          </div>
          <div className="mt-1 text-center text-[8px] font-semibold uppercase tracking-widest text-sky-200/50">
            Salkara Group of Restaurants ★ CISO Marine World
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
