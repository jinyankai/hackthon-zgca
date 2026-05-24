"use client";

import { Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { useDemoSocket } from "@/hooks/useDemoSocket";
import { pickRandomAutoDemoScript, type AutoDemoScript } from "@/mocks/demoScript";
import type { DemoEvent } from "@/types/events";

type PlayerStatus = "idle" | "playing" | "stopping" | "finished" | "error";
type EventWaiter = {
  type: DemoEvent["type"];
  resolve: (event: DemoEvent) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

const STEP_DELAY = 900;
const EVENT_TIMEOUT = 45000;

export function AutoDemoPlayer() {
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [activeScript, setActiveScript] = useState<AutoDemoScript | null>(null);
  const [stepLabel, setStepLabel] = useState("手动演示可用");
  const [turnIndex, setTurnIndex] = useState(0);
  const waitersRef = useRef<EventWaiter[]>([]);
  const cancelRef = useRef(false);

  const handleEvent = (event: DemoEvent) => {
    const waiter = waitersRef.current.find((item) => item.type === event.type);
    if (!waiter) return;
    clearTimeout(waiter.timer);
    waitersRef.current = waitersRef.current.filter((item) => item !== waiter);
    waiter.resolve(event);
  };

  const { send } = useDemoSocket("agent", handleEvent);

  const waitFor = (type: DemoEvent["type"]) =>
    new Promise<DemoEvent>((resolve, reject) => {
      const waiter: EventWaiter = {
        type,
        resolve,
        reject,
        timer: setTimeout(() => {
          waitersRef.current = waitersRef.current.filter((item) => item !== waiter);
          reject(new Error(`等待 ${type} 超时`));
        }, EVENT_TIMEOUT),
      };
      waitersRef.current.push(waiter);
    });

  const delay = () => new Promise((resolve) => window.setTimeout(resolve, STEP_DELAY));

  const ensureActive = () => {
    if (cancelRef.current) throw new Error("自动演示已停止");
  };

  const play = async () => {
    if (status === "playing") return;

    const script = pickRandomAutoDemoScript();
    cancelRef.current = false;
    setStatus("playing");
    setActiveScript(script);
    setTurnIndex(0);
    setStepLabel("正在重置对话");

    try {
      let pendingEvent = waitFor("sync_state");
      send("demo_reset", {});
      await pendingEvent;
      await delay();

      for (let index = 0; index < script.turns.length; index += 1) {
        ensureActive();
        const turn = script.turns[index];
        setTurnIndex(index + 1);

        setStepLabel(`第 ${index + 1} 轮：客户发言`);
        pendingEvent = waitFor("customer_translated");
        send("customer_send", { inputMode: "script", text: turn.customerText });
        await pendingEvent;
        await delay();

        ensureActive();
        setStepLabel(`第 ${index + 1} 轮：客服草稿上行优化`);
        pendingEvent = waitFor("agent_polished");
        send("agent_draft", { inputMode: "script", text: turn.agentDraft });
        const polished = await pendingEvent;
        await delay();

        ensureActive();
        setStepLabel(`第 ${index + 1} 轮：确认发送给客户`);
        const text = polished.type === "agent_polished" ? polished.payload.polishedText : turn.agentDraft;
        pendingEvent = waitFor("sync_state");
        send("agent_approved", { text });
        await pendingEvent;
        await delay();
      }

      ensureActive();
      setStepLabel("正在结束对话并生成总结");
      const summaryEvent = waitFor("conversation_summary");
      send("agent_end_conversation", {});
      await summaryEvent;
      setStatus("finished");
      setStepLabel("自动演示完成，可回到手动演示");
    } catch (error) {
      if (cancelRef.current) {
        setStatus("idle");
        setStepLabel("已回到手动演示");
      } else {
        setStatus("error");
        setStepLabel(error instanceof Error ? error.message : "自动演示失败");
      }
    }
  };

  const stop = () => {
    cancelRef.current = true;
    setStatus("stopping");
    setStepLabel("正在停止自动演示");
  };

  const resetManual = () => {
    cancelRef.current = true;
    send("demo_reset", {});
    setStatus("idle");
    setActiveScript(null);
    setTurnIndex(0);
    setStepLabel("手动演示可用");
  };

  const totalTurns = activeScript?.turns.length ?? 0;

  return (
    <section className="auto-demo">
      <div className="auto-demo-copy">
        <div className="section-title">
          <Sparkles size={18} />
          <h2>自动演示播放</h2>
        </div>
        <p>{activeScript ? `${activeScript.title}：${activeScript.description}` : "每次随机选择一组多轮对话，也可随时回退到手动演示。"}</p>
        <span>
          {stepLabel}
          {totalTurns > 0 ? `（${turnIndex}/${totalTurns}）` : ""}
        </span>
      </div>

      <div className="auto-demo-actions">
        <button className="secondary-button" onClick={play} disabled={status === "playing" || status === "stopping"}>
          <Play size={18} />
          随机自动播放
        </button>
        <button className="ghost-button" onClick={stop} disabled={status !== "playing"}>
          <Pause size={18} />
          停止
        </button>
        <button className="ghost-button" onClick={resetManual}>
          <RotateCcw size={18} />
          回到手动演示
        </button>
      </div>
    </section>
  );
}
