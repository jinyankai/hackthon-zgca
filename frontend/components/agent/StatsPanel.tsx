"use client";

import { useEffect, useState } from "react";
import { BarChart3, Shield, AlertTriangle, Activity } from "lucide-react";

interface Stats {
  totalMessages: number;
  protectedCount: number;
  blockedExpressions: number;
  riskFlagsTriggered: string[];
  emotionHistory: { timestamp: string; battery: number; emotionLevel: string; emotionScore: number }[];
  highEmotionCount: number;
  sessionStart: string;
}

export function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const fetchStats = () => {
      fetch("http://localhost:8000/api/stats")
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    };
    fetchStats();
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  const maxBattery = 100;
  const historyPoints = stats.emotionHistory.slice(-20);

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <BarChart3 size={18} />
        <h2>实时防护统计</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Shield size={24} />
          <div className="stat-value">{stats.protectedCount}</div>
          <div className="stat-label">消息已防护</div>
        </div>
        <div className="stat-card stat-card-warning">
          <AlertTriangle size={24} />
          <div className="stat-value">{stats.blockedExpressions}</div>
          <div className="stat-label">恶意表达拦截</div>
        </div>
        <div className="stat-card stat-card-danger">
          <Activity size={24} />
          <div className="stat-value">{stats.highEmotionCount}</div>
          <div className="stat-label">高压触发次数</div>
        </div>
      </div>

      {historyPoints.length > 1 && (
        <div className="stats-chart">
          <div className="chart-label">情绪电量曲线</div>
          <svg viewBox={`0 0 ${historyPoints.length * 20} 60`} className="emotion-chart">
            <polyline
              fill="none"
              stroke="url(#chartGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={historyPoints
                .map((p, i) => `${i * 20 + 10},${60 - (p.battery / maxBattery) * 55}`)
                .join(" ")}
            />
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--green)" />
                <stop offset="50%" stopColor="var(--amber)" />
                <stop offset="100%" stopColor="var(--coral)" />
              </linearGradient>
            </defs>
            {historyPoints.map((p, i) => (
              <circle
                key={i}
                cx={i * 20 + 10}
                cy={60 - (p.battery / maxBattery) * 55}
                r="3"
                fill={p.battery > 70 ? "var(--green)" : p.battery > 40 ? "var(--amber)" : "var(--coral)"}
              />
            ))}
          </svg>
        </div>
      )}

      {stats.riskFlagsTriggered.length > 0 && (
        <div className="stats-flags">
          <div className="chart-label">触发的风险标签</div>
          <div className="flag-chips">
            {stats.riskFlagsTriggered.map((flag) => (
              <span key={flag} className="flag-chip">{flag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
