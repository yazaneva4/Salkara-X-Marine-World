"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Role } from "@/lib/types";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = (params.get("role") as Role) || "salkara";
  const next = params.get("next");

  const [role, setRole] = useState<Role>(
    initialRole === "marine" ? "marine" : "salkara"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push(next || (role === "salkara" ? "/salkara" : "/marine"));
      router.refresh();
    } catch {
      setError("Network error, please try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-salkara via-gold to-marine" />
      <div className="overflow-hidden rounded-b-2xl bg-white shadow-xl ring-1 ring-slate-200">
        {/* Role tabs */}
        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={() => setRole("salkara")}
            className={`py-3 text-sm font-bold transition-colors ${
              role === "salkara"
                ? "bg-salkara text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            🍽️ Salkara Staff
          </button>
          <button
            type="button"
            onClick={() => setRole("marine")}
            className={`py-3 text-sm font-bold transition-colors ${
              role === "marine"
                ? "bg-marine text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            🐠 Marine World Staff
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6">
          <p className="text-sm text-slate-500">
            {role === "salkara"
              ? "Issue coupons and apply the food discount."
              : "Redeem the entry-ticket discount for guests."}
          </p>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-marine focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-marine focus:outline-none"
              required
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
            className={`w-full rounded-lg px-4 py-3 text-sm font-bold text-white disabled:opacity-60 ${
              role === "salkara"
                ? "bg-salkara hover:bg-salkara-light"
                : "bg-marine hover:bg-marine-light"
            }`}
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
