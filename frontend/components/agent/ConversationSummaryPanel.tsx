import { HeartHandshake, ListChecks, ShieldAlert } from "lucide-react";
import type { ConversationSummary } from "@/types/conversation";

export function ConversationSummaryPanel({ summary }: { summary?: ConversationSummary | null }) {
  if (!summary) return null;

  return (
    <div className={`summary-panel ${summary.maliciousDetected ? "summary-warning" : ""}`}>
      <div className="section-title">
        {summary.maliciousDetected ? <ShieldAlert size={18} /> : <ListChecks size={18} />}
        <h3>对话复盘</h3>
      </div>

      <div className="summary-grid">
        <div>
          <span>内容梳理</span>
          <p>{summary.summary}</p>
        </div>
        <div>
          <span>客户诉求</span>
          <p>{summary.customerRequest}</p>
        </div>
        <div>
          <span>处理结果</span>
          <p>{summary.handledResult}</p>
        </div>
        <div>
          <span>情绪回顾</span>
          <p>{summary.emotionReview}</p>
        </div>
      </div>

      {summary.maliciousDetected && (
        <div className="support-box">
          <div className="section-title">
            <HeartHandshake size={18} />
            <h3>给服务者的话</h3>
          </div>
          <p>{summary.supportMessage}</p>
          <div className="tip-row">
            {summary.recoveryTips.map((tip) => (
              <span key={tip}>{tip}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
