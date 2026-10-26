"use client";

import { useCallback, useState } from "react";
import CouponActions from "./CouponActions";
import CouponCard from "./CouponCard";
import {
  useCouponStatusRealtime,
  type CouponLiveStatus,
} from "@/lib/useCouponRealtime";
import type { CouponStatus, Role } from "@/lib/types";

interface Props {
  code: string;
  name: string;
  validUntil: string;
  initialStatus: CouponStatus;
  marineUsedAt: string | null;
  salkaraUsedAt: string | null;
  whatsappMasked?: string;
  role: Role | null;
  couponUrl: string;
  customerWhatsapp?: string;
  customerEmail?: string;
}

export default function CouponLiveView(props: Props) {
  const [live, setLive] = useState<CouponLiveStatus>({
    status: props.initialStatus,
    marineUsedAt: props.marineUsedAt,
    salkaraUsedAt: props.salkaraUsedAt,
  });
  const handleSync = useCallback((coupon: CouponLiveStatus) => setLive(coupon), []);
  const realtimeState = useCouponStatusRealtime(props.code, handleSync);

  return (
    <>
      <div className="no-print mb-2 flex justify-end">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            realtimeState === "connected"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {realtimeState === "connected" ? "● Live updates" : "Syncing updates…"}
        </span>
      </div>

      <CouponCard
        code={props.code}
        name={props.name}
        validUntil={props.validUntil}
        status={live.status}
        whatsappMasked={props.whatsappMasked}
        couponUrl={props.couponUrl}
        marineUsedAt={live.marineUsedAt}
      />

      <div className="mt-6 no-print">
        <CouponActions
          code={props.code}
          name={props.name}
          validUntil={props.validUntil}
          initialStatus={live.status}
          marineUsedAt={live.marineUsedAt}
          salkaraUsedAt={live.salkaraUsedAt}
          role={props.role}
          couponUrl={props.couponUrl}
          customerWhatsapp={props.customerWhatsapp}
customerEmail={props.customerEmail}
        />
      </div>
    </>
  );
}
