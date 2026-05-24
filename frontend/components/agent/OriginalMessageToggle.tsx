import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export function OriginalMessageToggle({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="original-toggle">
      <button className="ghost-button" onClick={() => setVisible((value) => !value)}>
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        {visible ? "隐藏原文" : "查看原文"}
      </button>
      {visible && <p className="original-text">{text}</p>}
    </div>
  );
}
