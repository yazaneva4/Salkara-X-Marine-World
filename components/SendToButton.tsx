"use client";

import React, { useId, useRef, useState } from "react";
import {
  CHANNELS,
  googleChatLink,
  isEmail,
  messageLink,
  type Channel,
} from "@/lib/messaging";

interface Props {
  number: string;
  message: string;
  label: string;
  variant?: "solid" | "outline" | "soft";
  size?: "sm" | "md";
  className?: string;
  /** Pre-select an app, e.g. the one chosen when the coupon was issued. */
  defaultChannel?: Channel;
  /** Pre-fill the Google Chat email. */
  defaultEmail?: string;
  /** Start with the menu open. */
  defaultOpen?: boolean;
}

/**
 * "Send to" menu: staff pick the app (WhatsApp, Apple Messages, Google Messages
 * or Google Chat) and open it with the message pre-filled. Everything is a
 * plain link, no messaging API is involved. Google Chat needs the customer's
 * email address, so choosing it shows an email field.
 */
export default function SendToButton({
  number,
  message,
  label,
  variant = "solid",
  size = "md",
  className = "",
  defaultChannel = "whatsapp",
  defaultEmail = "",
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [email, setEmail] = useState(defaultEmail);
  const emailId = useId();

  // The menu can be dragged by its header, so it never has to cover what the
  // staff member is looking at. It returns to its normal place when reopened.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  // Open upward when there is no room below (e.g. a button near the bottom of a phone screen).
  const wrapRef = useRef<HTMLSpanElement>(null);
  const [above, setAbove] = useState(false);
  const drag = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  function startDrag(e: React.PointerEvent<HTMLDivElement>) {
    drag.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // The pointer may already be gone; dragging still works through move events.
    }
  }
  function moveDrag(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    setOffset({ x: d.baseX + e.clientX - d.startX, y: d.baseY + e.clientY - d.startY });
  }
  function endDrag() {
    drag.current = null;
  }

  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2";
  const sizes = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm";
  const variants: Record<string, string> = {
    solid: "bg-salkara text-white hover:bg-salkara-light shadow-sm",
    outline: "border border-salkara text-salkara-dark hover:bg-salkara/10 bg-white",
    soft: "bg-salkara/15 text-salkara-dark hover:bg-salkara/25",
  };

  const chat = channel === "google-chat";
  const href =
    channel === "google-chat"
      ? isEmail(email)
        ? googleChatLink(email)
        : ""
      : messageLink(channel, number, message);
  const external = href.startsWith("http");
  const current = CHANNELS.find((c) => c.id === channel);

  return (
    <span ref={wrapRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => {
          const box = wrapRef.current?.getBoundingClientRect();
          const below = box ? window.innerHeight - box.bottom : Infinity;
          setAbove(!!box && below < 340 && box.top > below);
          setOffset({ x: 0, y: 0 });
          setOpen((v) => !v);
        }}
        className={`${base} ${sizes} ${variants[variant]}`}
      >
        {label}
        <span aria-hidden="true">▾</span>
      </button>

      {open && (
        <div
          role="group"
          aria-label="Send to"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
          className={`absolute right-0 z-20 w-72 ${above ? "bottom-full mb-2" : "mt-2"} rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg`}
        >
          <div
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            title="Drag to move"
            className="-mx-3 -mt-3 mb-1 flex cursor-grab touch-none select-none items-center justify-between rounded-t-xl bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 active:cursor-grabbing"
          >
            <span>Send to</span>
            <span aria-hidden="true" className="normal-case tracking-normal text-slate-400">⠿ drag to move</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.id === channel}
                onClick={() => setChannel(c.id)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-semibold ${
                  c.id === channel
                    ? "border-salkara bg-salkara/10 text-salkara-dark"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">{current?.hint}</p>

          {chat && (
            <div className="mt-2">
              <label htmlFor={emailId} className="mb-1 block text-xs font-semibold text-slate-600">
                Customer email
              </label>
              <input
                id={emailId}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-salkara focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">
                Google Chat links cannot pre-fill text, so the message is copied. Paste it into the chat.
              </p>
            </div>
          )}

          {href ? (
            <a
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={() => {
                if (chat) void navigator.clipboard?.writeText(message).catch(() => {});
                setOpen(false);
              }}
              className={`${base} ${sizes} ${variants.solid} mt-3 w-full`}
            >
              {chat ? "Copy message and open Google Chat" : `Open ${current?.label}`}
            </a>
          ) : (
            <span
              aria-disabled="true"
              className={`${base} ${sizes} mt-3 w-full cursor-not-allowed bg-slate-200 text-slate-400`}
            >
              Enter a valid email to continue
            </span>
          )}
        </div>
      )}
    </span>
  );
}
