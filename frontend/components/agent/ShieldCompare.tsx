"use client";

import { Shield } from "lucide-react";
import type { TranslatedMessage } from "@/types/conversation";

export function ShieldCompare({ translated }: { translated?: TranslatedMessage | null }) {
  if (!translated) {
    return (
      <div className="shield-compare empty-state">
        发送客户消息后，这里将展示有/无护盾的对比效果
      </div>
    );
  }

  return (
    <div className="shield-compare">
      <div className="compare-header">
        <Shield size={16} />
        <span>护盾效果对比</span>
      </div>
      <div className="compare-grid">
        <div className="compare-side compare-raw">
          <div className="compare-label">
            <span className="dot dot-red" />
            无护盾 — 原始消息
          </div>
          <div className="compare-content compare-content-raw">
            {translated.originalText}
          </div>
        </div>

        <div className="compare-divider">
          <div className="shield-icon-animated">
            <Shield size={28} />
          </div>
          <div className="shield-particles">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="particle" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        </div>

        <div className="compare-side compare-filtered">
          <div className="compare-label">
            <span className="dot dot-green" />
            有护盾 — AI 降噪
          </div>
          <div className="compare-content compare-content-filtered">
            {translated.filteredText}
          </div>
        </div>
      </div>
    </div>
  );
}
