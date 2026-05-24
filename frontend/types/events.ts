import type { ConversationState, ConversationSummary, InputMode, PolishedReply, TranslatedMessage } from "./conversation";

export type DemoEvent =
  | {
      type: "customer_voice_transcribed";
      payload: { audioMode: "browser_speech" | "mock"; transcript: string; confidence: number };
    }
  | { type: "customer_send"; payload: { inputMode: InputMode; text: string } }
  | { type: "customer_translated"; payload: TranslatedMessage }
  | { type: "agent_draft"; payload: { inputMode: InputMode; text: string } }
  | { type: "agent_polished"; payload: PolishedReply }
  | { type: "agent_approved"; payload: { text: string } }
  | { type: "agent_end_conversation"; payload: Record<string, never> }
  | { type: "demo_reset"; payload: Record<string, never> }
  | { type: "conversation_summary"; payload: ConversationSummary }
  | { type: "system_alert"; payload: { level: "info" | "warning" | "critical"; message: string } }
  | { type: "sync_state"; payload: ConversationState };
