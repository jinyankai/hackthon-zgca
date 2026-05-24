import { Wifi, WifiOff } from "lucide-react";
import type { WsStatus } from "@/lib/wsClient";

export function ConnectionBadge({ status }: { status: WsStatus }) {
  const online = status === "open";
  return (
    <span className={`connection-badge ${online ? "is-online" : "is-offline"}`}>
      {online ? <Wifi size={16} /> : <WifiOff size={16} />}
      {online ? "已连接" : "重连中"}
    </span>
  );
}
