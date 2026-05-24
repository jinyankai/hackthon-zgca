"use client";

import { useState } from "react";
import { AlertTriangle, ShieldCheck, Volume2, VolumeX } from "lucide-react";
import type { TranslatedMessage } from "@/types/conversation";
import { OriginalMessageToggle } from "./OriginalMessageToggle";
import { speak, stop, isTTSSupported } from "@/lib/tts";

export function FilteredMessageCard({ translated }: { translated?: TranslatedMessage | null }) {
  const [speaking, setSpeaking] = useState(false);

  if (!translated) {
    return <div className="empty-state tall">等待客户输入后生成 AI 降噪结果</div>;
  }

  const handleSpeak = () => {
    if (speaking) {
      stop();
      setSpeaking(false);
    } else {
      const started = speak(translated.filteredText, () => setSpeaking(false));
      if (started) setSpeaking(true);
    }
  };

  return (
    <div className="filtered-card">
      <div className="section-title">
        <ShieldCheck size={20} />
        <h2>AI 降噪结果</h2>
        {isTTSSupported() && (
          <button className="tts-button" onClick={handleSpeak} title={speaking ? "停止朗读" : "朗读"}>
            {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}
      </div>

      <p className="filtered-text">{translated.filteredText}</p>

      <div className="info-grid">
        <div>
          <span>核心诉求</span>
          <p>{translated.coreRequest}</p>
        </div>
        <div>
          <span>情绪等级</span>
          <strong className={`emotion-pill emotion-${translated.emotionLevel}`}>{translated.emotionLevel}</strong>
        </div>
      </div>

      <div className="risk-row">
        <AlertTriangle size={16} />
        {translated.riskFlags.length ? translated.riskFlags.map((flag) => <span key={flag}>{flag}</span>) : <span>暂无风险标签</span>}
      </div>

      <OriginalMessageToggle text={translated.originalText} />
    </div>
  );
}
