"use client";

import { useEffect, useRef, useState } from "react";
import { createWsClient, type WsRole, type WsStatus } from "@/lib/wsClient";
import type { DemoEvent } from "@/types/events";

export function useDemoSocket(role: WsRole, onEvent: (event: DemoEvent) => void) {
  const [status, setStatus] = useState<WsStatus>("connecting");
  const clientRef = useRef<ReturnType<typeof createWsClient> | null>(null);
  const onEventRef = useRef(onEvent);

  onEventRef.current = onEvent;

  useEffect(() => {
    clientRef.current = createWsClient({
      role,
      onStatus: setStatus,
      onEvent: (event) => onEventRef.current(event),
    });

    return () => clientRef.current?.close();
  }, [role]);

  return {
    status,
    send: (type: DemoEvent["type"], payload: unknown) => clientRef.current?.send(type, payload),
  };
}
