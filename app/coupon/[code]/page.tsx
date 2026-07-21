import Link from "next/link";
import { headers } from "next/headers";
import CouponCard from "@/components/CouponCard";
import CouponActions from "@/components/CouponActions";
import { getServerSession } from "@/lib/auth";
import { getCoupon } from "@/lib/store";
import { maskWhatsApp } from "@/lib/coupon";

export const dynamic = "force-dynamic";

function absoluteBase(): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env) return env.replace(/\/$/, "");
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}

export default async function CouponPage({
  params,
}: {
  params: { code: string };
}) {
  const coupon = await getCoupon(params.code);
  const session = await getServerSession();
  const isStaff = !!session;

  const url = `${absoluteBase()}/coupon/${encodeURIComponent(params.code)}`;

  if (!coupon) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <div className="text-4xl">🔍</div>
          <h1 className="mt-3 text-lg font-bold text-slate-800">Coupon not found</h1>
          <p className="mt-1 text-sm text-slate-500">
            The code <span className="font-mono">{params.code}</span> does not exist.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-marine px-4 py-2 text-sm font-semibold text-white"
          >
            Go home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="no-print mb-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-marine hover:underline">
            ← Home
          </Link>
          {isStaff ? (
            <Link
              href={session!.role === "salkara" ? "/salkara" : "/marine"}
              className="text-sm font-semibold text-marine hover:underline"
            >
              Dashboard →
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-semibold text-marine hover:underline"
            >
              Staff sign in →
            </Link>
          )}
        </div>

        <CouponCard
          code={coupon.code}
          name={coupon.name}
          validUntil={coupon.validUntil}
          status={coupon.status}
          whatsappMasked={maskWhatsApp(coupon.whatsapp)}
          couponUrl={url}
        />

        <div className="mt-6 no-print">
          <CouponActions
            code={coupon.code}
            name={coupon.name}
            validUntil={coupon.validUntil}
            initialStatus={coupon.status}
            marineUsedAt={coupon.marineUsedAt}
            salkaraUsedAt={coupon.salkaraUsedAt}
            role={session?.role ?? null}
            couponUrl={url}
            customerWhatsapp={isStaff ? coupon.whatsapp : undefined}
          />
        </div>
      </div>
    </main>
  );
}
