"use client";

import { useState } from "react";

interface StyleSelectorProps {
  onStyleChange: (style: string, charName: string) => void;
}

const STYLES = [
  { id: "professional", label: "商务专业", icon: "💼" },
  { id: "gentle", label: "温柔化", icon: "🌸" },
  { id: "efficient", label: "高效精准", icon: "⚡" },
  { id: "anime", label: "二次元", icon: "✨" },
  { id: "custom_char", label: "自定义角色", icon: "🎭" },
];

export default function StyleSelector({ onStyleChange }: StyleSelectorProps) {
  const [active, setActive] = useState("professional");
  const [charName, setCharName] = useState("");

  function select(id: string) {
    setActive(id);
    onStyleChange(id, id === "custom_char" ? charName : "");
  }

  function handleCharInput(value: string) {
    setCharName(value);
    if (active === "custom_char") {
      onStyleChange("custom_char", value);
    }
  }

  return (
    <div className="style-selector">
      <div className="style-selector-label">🛡 情绪预设 — 选择你想以什么风格接收客户消息</div>
      <div className="style-selector-chips">
        {STYLES.map((s) => (
          <button
            key={s.id}
            className={`style-chip ${active === s.id ? "style-chip-active" : ""}`}
            onClick={() => select(s.id)}
          >
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>
      {active === "custom_char" && (
        <input
          className="style-char-input"
          type="text"
          placeholder="输入角色名，如：派蒙、哆啦A梦、钢铁侠..."
          value={charName}
          onChange={(e) => handleCharInput(e.target.value)}
          autoFocus
        />
      )}
    </div>
  );
}
