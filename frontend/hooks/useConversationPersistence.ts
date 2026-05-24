"use client";

import { useEffect, useRef } from "react";
import type { ConversationState } from "@/types/conversation";

const STORAGE_KEY = "emotion-shield-conversation";

export function useConversationPersistence(state: ConversationState | null) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!state || !state.messages.length) return;
    if (!initialized.current) {
      initialized.current = true;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);
}

export function loadPersistedConversation(): ConversationState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPersistedConversation() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
