"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  text: string;
  active: boolean;
}

export function DissolveText({ text, active }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dissolved, setDissolved] = useState(false);

  useEffect(() => {
    if (active) {
      setDissolved(false);
      const timer = setTimeout(() => setDissolved(true), 100);
      return () => clearTimeout(timer);
    }
    setDissolved(false);
  }, [active, text]);

  if (!active) {
    return <span className="dissolve-text">{text}</span>;
  }

  return (
    <span ref={containerRef} className="dissolve-text">
      {text.split("").map((char, i) => (
        <span
          key={`${i}-${char}`}
          className={`dissolve-char ${dissolved ? "dissolving" : ""}`}
          style={{
            animationDelay: `${Math.random() * 0.8}s`,
            "--dx": `${(Math.random() - 0.5) * 40}px`,
            "--dy": `${-Math.random() * 30 - 10}px`,
          } as React.CSSProperties}
        >
          {char}
        </span>
      ))}
    </span>
  );
}
