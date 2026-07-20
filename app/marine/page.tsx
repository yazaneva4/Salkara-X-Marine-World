import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import MarineDashboard from "@/components/MarineDashboard";
import { getServerSession } from "@/lib/auth";
import { listCoupons, isStorageConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MarinePage() {
  const session = await getServerSession();
  if (!session || session.role !== "marine") {
    redirect("/login?role=marine&next=/marine");
  }

  const coupons = await listCoupons();

  return (
    <div className="min-h-screen bg-slate-100">
      <Nav role={session.role} username={session.username} />
      <main className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-slate-800">
            CISO Marine World — Redeem coupons
          </h1>
          <p className="text-sm text-slate-500">
            Scan or enter a coupon code to give 10% off entry tickets.
          </p>
        </div>

        {!isStorageConfigured() && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Storage not configured — running in local test mode. Add a Vercel Blob
            store and set <code className="font-mono">BLOB_READ_WRITE_TOKEN</code> for
            production.
          </div>
        )}

        <MarineDashboard initialCoupons={coupons} />
      </main>
    </div>
  );
}
