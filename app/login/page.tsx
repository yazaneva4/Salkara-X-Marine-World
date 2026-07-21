import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-marine-navy to-marine-dark px-4 py-12">
      <div className="warm-glow pointer-events-none absolute inset-y-0 left-0 w-1/2" />
      <div className="ocean-glow pointer-events-none absolute inset-y-0 right-0 w-1/2" />
      <div className="relative mx-auto max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="text-sm font-semibold text-sky-200 hover:underline">
            ← Salkara × CISO Marine World
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold text-white">Staff sign in</h1>
        </div>
        <Suspense fallback={<div className="text-center text-sky-200">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
