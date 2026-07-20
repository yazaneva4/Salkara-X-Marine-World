import React from "react";
import type { CouponStatus } from "@/lib/types";

const map: Record<CouponStatus, { label: string; className: string }> = {
  issued: { label: "Issued", className: "bg-slate-100 text-slate-600" },
  marine_used: {
    label: "Used at Marine World",
    className: "bg-marine/10 text-marine",
  },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
};

export default function StatusBadge({ status }: { status: CouponStatus }) {
  const s = map[status];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
      {s.label}
    </span>
  );
}
