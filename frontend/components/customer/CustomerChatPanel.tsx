"use client";

import { Mic, Send, Square, Type } from "lucide-react";
import { useMemo, useState } from "react";
import { useDemoSocket } from "@/hooks/useDemoSocket";
import { getSpeechRecognition, type SpeechStatus, voiceLabel } from "@/lib/speech";
import { mockTranscript, type DemoScenario } from "@/mocks/demoScript";
import type { ConversationState, InputMode } from "@/types/conversation";
import type { DemoEvent } from "@/types/events";
import { ConnectionBadge } from "@/components/shared/ConnectionBadge";
import { DemoScriptButtons } from "./DemoScriptButtons";

export function CustomerChatPanel({ onScenarioDraft }: { onScenarioDraft: (draft: string) => void }) {
  const [state, setState] = useState<ConversationState | null>(null);
  const [text, setText] = useState("");
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [voiceStatus, setVoiceStatus] = useState<SpeechStatus>("idle");

  const handleEvent = (event: DemoEvent) => {
    if (event.type === "sync_state") setState(event.payload);
  };

  const { status, send } = useDemoSocket("customer", handleEvent);
  const customerMessages = useMemo(() => state?.messages ?? [], [state]);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    send("customer_send", { inputMode, text: value });
    setText("");
    setInputMode("text");
  };

  const pickScenario = (scenario: DemoScenario) => {
    setText(scenario.customerText);
    setInputMode(scenario.inputMode);
    onScenarioDraft(scenario.agentDraft);
  };

  const useMockVoice = () => {
    setText(mockTranscript);
    setInputMode("voice");
    setVoiceStatus("transcript_ready");
  };

  const startVoice = () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setVoiceStatus("failed");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setVoiceStatus("recording");
    recognition.onspeechend = () => {
      setVoiceStatus("transcribing");
      recognition.stop();
    };
    recognition.onerror = () => setVoiceStatus("failed");
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        setVoiceStatus("failed");
        return;
      }
      setText(transcript);
      setInputMode("voice");
      setVoiceStatus("transcript_ready");
    };

    recognition.start();
  };

  return (
    <section className="panel customer-panel">
      <header className="panel-header">
        <div>
          <p className="eyebrow">客户视角</p>
          <h1>订单沟通</h1>
        </div>
        <ConnectionBadge status={status} />
      </header>

      <div className="chat-list" aria-live="polite">
        {customerMessages.length === 0 ? (
          <div className="empty-state">选择场景或直接输入客户消息</div>
        ) : (
          customerMessages.map((message) => (
            <div className={`bubble ${message.sender === "customer" ? "from-customer" : "from-agent"}`} key={message.id}>
              <span>{message.sender === "customer" ? "我" : "客服"}</span>
              <p>{message.text}</p>
            </div>
          ))
        )}
      </div>

      <DemoScriptButtons onPick={pickScenario} />

      <div className="voice-row">
        <button className="icon-button" onClick={startVoice} title="语音输入">
          {voiceStatus === "recording" ? <Square size={18} /> : <Mic size={18} />}
        </button>
        <span className={`voice-status ${voiceStatus}`}>{voiceLabel(voiceStatus)}</span>
        {voiceStatus === "failed" && (
          <button className="inline-button" onClick={useMockVoice}>
            使用演示语音文本
          </button>
        )}
      </div>

      <div className="composer">
        <span className="mode-chip">
          {inputMode === "voice" ? <Mic size={14} /> : <Type size={14} />}
          {inputMode === "voice" ? "语音转写" : inputMode === "script" ? "演示脚本" : "文本"}
        </span>
        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            if (inputMode !== "voice") setInputMode("text");
          }}
          placeholder="输入客户消息，或点击麦克风说话"
        />
        <button className="primary-button" onClick={submit}>
          <Send size={18} />
          发送
        </button>
      </div>
    </section>
  );
}
