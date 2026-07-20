import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-marine-navy to-marine-dark px-4 py-12">
      <div className="mx-auto max-w-md">
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
