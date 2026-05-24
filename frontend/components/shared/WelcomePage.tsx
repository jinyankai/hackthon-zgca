"use client";

import { useState } from "react";
import { Shield, Heart, Zap, ArrowRight } from "lucide-react";

interface Props {
  onEnter: () => void;
}

export function WelcomePage({ onEnter }: Props) {
  const [exiting, setExiting] = useState(false);

  const handleEnter = () => {
    setExiting(true);
    setTimeout(onEnter, 600);
  };

  return (
    <div className={`welcome-page ${exiting ? "welcome-exit" : ""}`}>
      <div className="welcome-bg">
        <div className="welcome-orb orb-1" />
        <div className="welcome-orb orb-2" />
        <div className="welcome-orb orb-3" />
      </div>

      <div className="welcome-content">
        <div className="welcome-logo">
          <div className="logo-shield">
            <Shield size={48} strokeWidth={1.5} />
            <Heart size={20} className="logo-heart" />
          </div>
        </div>

        <h1 className="welcome-title">AI 情绪护盾</h1>
        <p className="welcome-slogan">让每一次对话，都被温柔以待</p>

        <div className="welcome-features">
          <div className="welcome-feature">
            <Shield size={18} />
            <span>双向情绪防火墙</span>
          </div>
          <div className="welcome-feature">
            <Heart size={18} />
            <span>智能情绪降噪</span>
          </div>
          <div className="welcome-feature">
            <Zap size={18} />
            <span>实时自适应保护</span>
          </div>
        </div>

        <button className="welcome-enter" onClick={handleEnter}>
          <span>进入系统</span>
          <ArrowRight size={18} />
        </button>

        <p className="welcome-credit">ZGC 黑客松 · AI Emotion Shield</p>
      </div>
    </div>
  );
}
