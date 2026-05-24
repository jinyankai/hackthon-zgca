import { Battery, BatteryWarning } from "lucide-react";
import type { EmotionStatus } from "@/types/conversation";

export function EmotionBattery({ status }: { status: EmotionStatus }) {
  return (
    <div className={`battery battery-${status.status}`}>
      <div className="battery-label">
        {status.status === "critical" ? <BatteryWarning size={18} /> : <Battery size={18} />}
        <span>情绪电量</span>
        <strong>{status.battery}</strong>
      </div>
      <div className="battery-track">
        <div className="battery-fill" style={{ width: `${status.battery}%` }} />
      </div>
      {status.restSuggested && <p className="rest-alert">建议短暂休息或转接高压会话</p>}
    </div>
  );
}
