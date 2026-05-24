"use client";

import { Check, Mic, Send, Square, WandSparkles } from "lucide-react";
import { useState } from "react";
import { getSpeechRecognition, normalizeServiceSpeechTranscript, type SpeechStatus, voiceLabel } from "@/lib/speech";
import type { PolishedReply } from "@/types/conversation";

const mockAgentTranscript = "我马上帮您核实订单状态，请稍等。";

export function AgentReplyEditor({
  draft,
  onDraftChange,
  polished,
  isPolishing,
  onPolish,
  onApprove,
}: {
  draft: string;
  onDraftChange: (value: string) => void;
  polished?: PolishedReply | null;
  isPolishing: boolean;
  onPolish: () => void;
  onApprove: () => void;
}) {
  const [voiceStatus, setVoiceStatus] = useState<SpeechStatus>("idle");
  const [corrections, setCorrections] = useState<string[]>([]);

  const applyTranscript = (value: string) => {
    const normalized = normalizeServiceSpeechTranscript(value);
    onDraftChange(normalized.text);
    setCorrections(normalized.corrections);
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
      applyTranscript(transcript);
    };

    recognition.start();
  };

  return (
    <div className="reply-editor">
      <div className="section-title">
        <Send size={18} />
        <h3>服务者回复</h3>
      </div>

      <div className="voice-row agent-voice-row">
        <button className="icon-button" onClick={startVoice} title="客服语音输入">
          {voiceStatus === "recording" ? <Square size={18} /> : <Mic size={18} />}
        </button>
        <span className={`voice-status ${voiceStatus}`}>{voiceLabel(voiceStatus)}</span>
        {voiceStatus === "failed" && (
          <button className="inline-button" onClick={() => applyTranscript(mockAgentTranscript)}>
            使用演示客服语音
          </button>
        )}
      </div>

      {corrections.length > 0 && <p className="correction-note">已自动纠正常见客服词：{corrections.join("、")}</p>}

      <textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="输入或语音转写服务者草稿，例如：我帮您核实一下，请稍等。" />

      <div className="misrecognition-tips">
        <span>误识别处理</span>
        <p>语音只进草稿框，不会自动发送；请先检查文字，再点 AI 优化和确认发送。</p>
      </div>

      <div className="button-row">
        <button className="secondary-button" onClick={onPolish} disabled={!draft.trim() || isPolishing}>
          <WandSparkles size={18} />
          {isPolishing ? "优化中" : "AI 优化"}
        </button>
        <button className="primary-button" onClick={onApprove} disabled={!polished?.polishedText && !draft.trim()}>
          <Check size={18} />
          确认发送
        </button>
      </div>
      {polished && (
        <div className="polished-box">
          <span>优化后</span>
          <p>{polished.polishedText}</p>
          <small>{polished.changesSummary}</small>
        </div>
      )}
    </div>
  );
}
