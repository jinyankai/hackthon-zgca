import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { TranslatedMessage } from "@/types/conversation";
import { OriginalMessageToggle } from "./OriginalMessageToggle";

export function FilteredMessageCard({ translated }: { translated?: TranslatedMessage | null }) {
  if (!translated) {
    return <div className="empty-state tall">等待客户输入后生成 AI 降噪结果</div>;
  }

  return (
    <div className="filtered-card">
      <div className="section-title">
        <ShieldCheck size={20} />
        <h2>AI 降噪结果</h2>
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
