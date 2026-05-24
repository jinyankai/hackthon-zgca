import { Check, Send, WandSparkles } from "lucide-react";
import type { PolishedReply } from "@/types/conversation";

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
  return (
    <div className="reply-editor">
      <div className="section-title">
        <Send size={18} />
        <h3>服务者回复</h3>
      </div>
      <textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="输入口语化草稿，例如：我帮你看一下，别急。" />
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
