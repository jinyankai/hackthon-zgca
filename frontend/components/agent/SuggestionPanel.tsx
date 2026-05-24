import { Sparkles } from "lucide-react";
import type { SuggestedReply } from "@/types/conversation";

export function SuggestionPanel({ replies, onUse }: { replies: SuggestedReply[]; onUse: (text: string) => void }) {
  return (
    <div className="suggestion-panel">
      <div className="section-title">
        <Sparkles size={18} />
        <h3>建议回复</h3>
      </div>
      {replies.length === 0 ? (
        <p className="muted">等待客户消息</p>
      ) : (
        replies.map((reply) => (
          <button className="suggestion" key={reply.id} onClick={() => onUse(reply.text)}>
            <span>{reply.tone}</span>
            <p>{reply.text}</p>
          </button>
        ))
      )}
    </div>
  );
}
