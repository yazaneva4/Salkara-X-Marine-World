import type { Metadata } from "next";
import { Poppins, Great_Vibes } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const script = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Salkara x CISO Marine World — Coupons",
  description:
    "Issue and redeem joint holiday discount coupons for Salkara Group of Restaurants and CISO Marine World.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${script.variable}`}>
      <body className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
