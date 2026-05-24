"use client";

import { useEffect, useRef } from "react";
import { Battery, BatteryWarning, Heart } from "lucide-react";
import type { EmotionStatus } from "@/types/conversation";

export function EmotionBattery({ status }: { status: EmotionStatus }) {
  const prevBattery = useRef(status.battery);
  const delta = status.battery - prevBattery.current;

  useEffect(() => {
    prevBattery.current = status.battery;
  }, [status.battery]);

  const statusLabel =
    status.status === "critical" ? "危险" :
    status.status === "warning" ? "注意" : "健康";

  return (
    <div className={`battery battery-${status.status}`}>
      <div className="battery-label">
        {status.status === "critical" ? <BatteryWarning size={18} /> : <Battery size={18} />}
        <span>情绪电量</span>
        <span className="battery-status-tag">{statusLabel}</span>
        <strong>{status.battery}</strong>
      </div>
      <div className="battery-track">
        <div className="battery-fill" style={{ width: `${status.battery}%` }} />
      </div>
      <div className="battery-meta">
        {delta !== 0 && (
          <span className={`battery-delta ${delta < 0 ? "delta-down" : "delta-up"}`}>
            {delta > 0 ? "+" : ""}{delta}
          </span>
        )}
        {status.status === "critical" && (
          <span className="battery-heartbeat">
            <Heart size={12} /> 高压状态
          </span>
        )}
      </div>
      {status.restSuggested && <p className="rest-alert">建议短暂休息或转接高压会话</p>}
    </div>
  );
}
