"use client";

import React from "react";
import { WhatsAppIcon } from "./Icons";
import { waLink } from "@/lib/whatsapp";

interface Props {
  number: string;
  message: string;
  label: string;
  variant?: "solid" | "outline" | "soft";
  size?: "sm" | "md";
  className?: string;
  disabled?: boolean;
}

/**
 * A button that opens WhatsApp (app or web) with a pre-filled message.
 * Used across the app so every screen has a WhatsApp action.
 */
export default function WhatsAppButton({
  number,
  message,
  label,
  variant = "solid",
  size = "md",
  className = "",
  disabled = false,
}: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2";
  const sizes = size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2.5 text-sm";
  const variants: Record<string, string> = {
    solid: "bg-[#25D366] text-white hover:bg-[#1eb457] shadow-sm",
    outline:
      "border border-[#25D366] text-[#128C4B] hover:bg-[#25D366]/10 bg-white",
    soft: "bg-[#25D366]/15 text-[#0f7a41] hover:bg-[#25D366]/25",
  };

  if (disabled) {
    return (
      <span
        className={`${base} ${sizes} cursor-not-allowed bg-slate-200 text-slate-400 ${className}`}
        aria-disabled="true"
      >
        <WhatsAppIcon className="h-4 w-4" />
        {label}
      </span>
    );
  }

  return (
    <a
      href={waLink(number, message)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${sizes} ${variants[variant]} ${className}`}
    >
      <WhatsAppIcon className="h-4 w-4" />
      {label}
    </a>
  );
}
