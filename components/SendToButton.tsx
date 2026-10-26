"use client";

import React, { useId, useState } from "react";
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
    <span className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`${base} ${sizes} ${variants[variant]}`}
      >
        {label}
        <span aria-hidden="true">▾</span>
      </button>

      {open && (
        <div
          role="group"
          aria-label="Send to"
          className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Send to</div>
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
