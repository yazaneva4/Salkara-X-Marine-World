import Link from "next/link";
import WhatsAppButton from "@/components/WhatsAppButton";
import { ForkKnifeIcon, FishIcon } from "@/components/Icons";
import { getServerSession } from "@/lib/auth";
import { contactSalkaraMessage, contactMarineMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const SALKARA_WA = process.env.NEXT_PUBLIC_SALKARA_WHATSAPP || "";
const MARINE_WA = process.env.NEXT_PUBLIC_MARINE_WHATSAPP || "";

export default async function Home() {
  const session = await getServerSession();

  return (
    <main className="min-h-screen bg-gradient-to-b from-marine-navy via-marine-dark to-marine-navy text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-16">
        <div className="text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-sky-200">
            Salkara Group of Restaurants × CISO Marine World
          </div>
          <h1 className="text-3xl font-extrabold sm:text-5xl">
            <span className="font-script text-4xl text-gold sm:text-6xl">
              Joint Holiday
            </span>
            <br />
            Discount Coupons
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-sky-100/80 sm:text-base">
            Issue a coupon at Salkara, redeem 10% off entry tickets at CISO Marine
            World, then claim 10% off your food bill back at Salkara.
          </p>
        </div>

        {/* Portals */}
        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          <Link
            href={session?.role === "salkara" ? "/salkara" : "/login?role=salkara"}
            className="group rounded-2xl bg-salkara p-6 shadow-xl ring-1 ring-white/10 transition-transform hover:-translate-y-1"
          >
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-white/15">
              <ForkKnifeIcon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">Salkara Staff</h2>
            <p className="mt-1 text-sm text-white/80">
              Issue coupons for customers and apply the 10% food discount.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-white/90 group-hover:underline">
              {session?.role === "salkara" ? "Open dashboard" : "Sign in"} →
            </span>
          </Link>

          <Link
            href={session?.role === "marine" ? "/marine" : "/login?role=marine"}
            className="group rounded-2xl bg-marine p-6 shadow-xl ring-1 ring-white/10 transition-transform hover:-translate-y-1"
          >
            <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-white/15">
              <FishIcon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold">CISO Marine World Staff</h2>
            <p className="mt-1 text-sm text-white/80">
              Scan the coupon and give 10% off entry tickets.
            </p>
            <span className="mt-4 inline-block text-sm font-semibold text-white/90 group-hover:underline">
              {session?.role === "marine" ? "Open dashboard" : "Sign in"} →
            </span>
          </Link>
        </div>

        {/* How it works */}
        <div className="mx-auto mt-12 max-w-3xl">
          <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-sky-200">
            How it works
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                n: "1",
                t: "Get your coupon",
                d: "Salkara issues a coupon with your name & WhatsApp number.",
              },
              {
                n: "2",
                t: "Visit Marine World",
                d: "Show the coupon for 10% off entry tickets — staff mark it used.",
              },
              {
                n: "3",
                t: "Dine at Salkara",
                d: "Your coupon now unlocks 10% off your food bill.",
              },
            ].map((s) => (
              <div key={s.n} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="mb-2 grid h-8 w-8 place-items-center rounded-full bg-gold font-bold text-marine-navy">
                  {s.n}
                </div>
                <div className="font-semibold">{s.t}</div>
                <p className="mt-1 text-xs text-sky-100/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Customer contact */}
        {(SALKARA_WA || MARINE_WA) && (
          <div className="mx-auto mt-12 max-w-md rounded-2xl bg-white/5 p-5 text-center ring-1 ring-white/10">
            <p className="text-sm text-sky-100/80">Are you a customer? Message us:</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {SALKARA_WA && (
                <WhatsAppButton
                  number={SALKARA_WA}
                  message={contactSalkaraMessage()}
                  label="WhatsApp Salkara"
                />
              )}
              {MARINE_WA && (
                <WhatsAppButton
                  number={MARINE_WA}
                  message={contactMarineMessage()}
                  label="WhatsApp Marine World"
                />
              )}
            </div>
          </div>
        )}

        <p className="mt-12 text-center font-script text-2xl text-gold">
          Taste the Best, Discover the Ocean
        </p>
      </div>
    </main>
  );
}
