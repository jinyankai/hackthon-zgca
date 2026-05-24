"use client";

import { useState } from "react";
import { AgentConsole } from "@/components/agent/AgentConsole";
import { CustomerChatPanel } from "@/components/customer/CustomerChatPanel";
import { AutoDemoPlayer } from "@/components/shared/AutoDemoPlayer";

export default function Home() {
  const [seededDraft, setSeededDraft] = useState("");

  return (
    <main className="app-shell">
      <div className="demo-title">
        <span>AI 情绪护盾</span>
        <strong>双向情绪防火墙</strong>
      </div>
      <AutoDemoPlayer />
      <div className="split-screen">
        <CustomerChatPanel onScenarioDraft={setSeededDraft} />
        <AgentConsole seededDraft={seededDraft} />
      </div>
    </main>
  );
}
