"use client";

import { useState } from "react";
import { useDemoSocket } from "@/hooks/useDemoSocket";
import type { ConversationState, PolishedReply } from "@/types/conversation";
import type { DemoEvent } from "@/types/events";
import { ConnectionBadge } from "@/components/shared/ConnectionBadge";
import { AgentReplyEditor } from "./AgentReplyEditor";
import { EmotionBattery } from "./EmotionBattery";
import { FilteredMessageCard } from "./FilteredMessageCard";
import { SuggestionPanel } from "./SuggestionPanel";

const initialEmotion = {
  battery: 100,
  status: "healthy" as const,
  lastUpdatedAt: new Date().toISOString(),
  restSuggested: false,
};

export function AgentConsole({ seededDraft }: { seededDraft: string }) {
  const [state, setState] = useState<ConversationState | null>(null);
  const [draft, setDraft] = useState("");
  const [polished, setPolished] = useState<PolishedReply | null>(null);
  const [isPolishing, setIsPolishing] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  const handleEvent = (event: DemoEvent) => {
    if (event.type === "sync_state") {
      setState(event.payload);
      if (event.payload.latestPolished) setPolished(event.payload.latestPolished);
    }
    if (event.type === "customer_translated") {
      setAlert(event.payload.source === "mock" ? "已使用演示 fallback 生成降噪结果" : null);
    }
    if (event.type === "agent_polished") {
      setIsPolishing(false);
      setPolished(event.payload);
    }
    if (event.type === "system_alert") {
      setAlert(event.payload.message);
      setIsPolishing(false);
    }
  };

  const { status, send } = useDemoSocket("agent", handleEvent);
  const currentDraft = draft || seededDraft;
  const translated = state?.latestTranslated;

  const polish = () => {
    if (!currentDraft.trim()) return;
    setIsPolishing(true);
    send("agent_draft", { inputMode: "text", text: currentDraft });
  };

  const approve = () => {
    const text = polished?.polishedText || currentDraft;
    if (!text.trim()) return;
    send("agent_approved", { text });
    setDraft("");
    setPolished(null);
  };

  return (
    <section className="panel agent-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">服务者视角</p>
          <h1>情绪护盾控制台</h1>
        </div>
        <ConnectionBadge status={status} />
      </header>

      {alert && <div className="alert-line">{alert}</div>}

      <div className="agent-grid">
        <FilteredMessageCard translated={translated} />
        <EmotionBattery status={state?.emotionStatus ?? initialEmotion} />
      </div>

      <SuggestionPanel
        replies={translated?.suggestedReplies ?? []}
        onUse={(value) => {
          setDraft(value);
          setPolished(null);
        }}
      />

      <AgentReplyEditor
        draft={currentDraft}
        onDraftChange={(value) => {
          setDraft(value);
          setPolished(null);
        }}
        polished={polished}
        isPolishing={isPolishing}
        onPolish={polish}
        onApprove={approve}
      />
    </section>
  );
}
