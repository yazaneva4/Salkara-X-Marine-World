"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoImg from "./LogoImg";
import type { Role } from "@/lib/types";

function BadgeFallback() {
  return (
    <span className="grid h-8 w-8 place-items-center rounded-lg bg-marine-navy text-xs font-black text-white">
      S×M
    </span>
  );
}

const labels: Record<Role, string> = {
  salkara: "Salkara Restaurant",
  marine: "CISO Marine World",
};

export default function Nav({ role, username }: { role: Role; username: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-white p-0.5 ring-1 ring-slate-200">
              <LogoImg
                src="/logos/salkara.png"
                alt="Salkara"
                className="h-full w-full object-contain"
                fallback={<BadgeFallback />}
              />
            </span>
            <span className="grid h-8 w-8 place-items-center rounded-md bg-black p-0.5">
              <LogoImg
                src="/logos/marine.png"
                alt="CISO Marine World"
                className="h-full w-full object-contain"
                fallback={<span className="h-full w-full" />}
              />
            </span>
          </span>
          <span className="hidden text-sm font-bold text-slate-700 sm:inline">
            Salkara × Marine World
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              role === "salkara"
                ? "bg-salkara/10 text-salkara"
                : "bg-marine/10 text-marine"
            }`}
          >
            {labels[role]} · {username}
          </span>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
