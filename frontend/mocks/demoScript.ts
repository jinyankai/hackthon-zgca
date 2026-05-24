import type { InputMode } from "@/types/conversation";

export interface DemoScenario {
  id: string;
  title: string;
  customerText: string;
  agentDraft: string;
  inputMode: InputMode;
}

export const demoScenarios: DemoScenario[] = [
  {
    id: "late-order",
    title: "暴怒催单",
    customerText: "你们到底会不会送？半小时了还没到！再不来我就投诉退款！",
    agentDraft: "我帮你看一下，别急。",
    inputMode: "script",
  },
  {
    id: "refund-threat",
    title: "退款威胁",
    customerText: "你们服务太差了，我现在就要退款，不处理我就差评。",
    agentDraft: "退款要看规则，不是我说退就退。",
    inputMode: "script",
  },
  {
    id: "verbal-attack",
    title: "极端辱骂",
    customerText: "你们都是废物吗？这点事都做不好？",
    agentDraft: "我现在处理。",
    inputMode: "script",
  },
];

export const mockTranscript = demoScenarios[0].customerText;
