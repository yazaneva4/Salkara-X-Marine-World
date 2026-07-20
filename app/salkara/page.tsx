import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import SalkaraDashboard from "@/components/SalkaraDashboard";
import { getServerSession } from "@/lib/auth";
import { listCoupons, isStorageConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SalkaraPage() {
  const session = await getServerSession();
  if (!session || session.role !== "salkara") {
    redirect("/login?role=salkara&next=/salkara");
  }

  const coupons = await listCoupons();

  return (
    <div className="min-h-screen bg-slate-100">
      <Nav role={session.role} username={session.username} />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold text-slate-800">
            Salkara — Coupon dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Issue coupons for customers and apply the food discount once they have
            visited Marine World.
          </p>
        </div>

        {!isStorageConfigured() && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Storage not configured — running in local test mode. Add a Vercel Blob
            store and set <code className="font-mono">BLOB_READ_WRITE_TOKEN</code> for
            production.
          </div>
        )}

        <SalkaraDashboard initialCoupons={coupons} />
      </main>
    </div>
  );
}
