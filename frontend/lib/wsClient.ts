import type { DemoEvent } from "@/types/events";

export type WsRole = "customer" | "agent";
export type WsStatus = "connecting" | "open" | "closed" | "error";

interface WsClientOptions {
  role: WsRole;
  onEvent: (event: DemoEvent) => void;
  onStatus?: (status: WsStatus) => void;
}

export function createWsClient({ role, onEvent, onStatus }: WsClientOptions) {
  const base = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws/demo";
  let ws: WebSocket | null = null;
  let retry = 0;
  let closedByUser = false;

  const send = (type: DemoEvent["type"], payload: unknown) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload, timestamp: new Date().toISOString() }));
    }
  };

  const connect = () => {
    onStatus?.("connecting");
    ws = new WebSocket(`${base}?role=${role}`);

    ws.onopen = () => {
      retry = 0;
      onStatus?.("open");
      send("sync_state", {});
    };

    ws.onmessage = (message) => {
      onEvent(JSON.parse(message.data) as DemoEvent);
    };

    ws.onerror = () => onStatus?.("error");

    ws.onclose = () => {
      onStatus?.("closed");
      if (closedByUser) return;
      const delay = Math.min(500 * 2 ** retry, 5000);
      retry += 1;
      window.setTimeout(connect, delay);
    };
  };

  connect();

  return {
    send,
    close: () => {
      closedByUser = true;
      ws?.close();
    },
  };
}
