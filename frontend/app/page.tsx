"use client";

import { useState } from "react";
import { AgentConsole } from "@/components/agent/AgentConsole";
import { CustomerChatPanel } from "@/components/customer/CustomerChatPanel";
import { WelcomePage } from "@/components/shared/WelcomePage";

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [seededDraft, setSeededDraft] = useState("");

  if (!entered) {
    return <WelcomePage onEnter={() => setEntered(true)} />;
  }

  return (
    <main className="app-shell">
      <div className="demo-title">
        <span>AI 情绪护盾</span>
        <strong>双向情绪防火墙</strong>
      </div>
      <div className="split-screen">
        <CustomerChatPanel onScenarioDraft={setSeededDraft} />
        <AgentConsole seededDraft={seededDraft} />
      </div>
    </main>
  );
}
