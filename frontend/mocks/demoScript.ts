import type { InputMode } from "@/types/conversation";
import corpus from "./dialogueCorpus.json";

export interface DemoScenario {
  id: string;
  title: string;
  customerText: string;
  agentDraft: string;
  inputMode: InputMode;
}

export interface AutoDemoTurn {
  customerText: string;
  agentDraft: string;
}

export interface AutoDemoScript {
  id: string;
  title: string;
  description: string;
  turns: AutoDemoTurn[];
}

export const demoScenarios: DemoScenario[] = corpus.manualScenarios.map((scenario) => ({
  ...scenario,
  inputMode: scenario.inputMode as InputMode,
}));

export const autoDemoScripts = corpus.autoScripts as AutoDemoScript[];

export const mockTranscript = demoScenarios[0].customerText;

export function pickRandomAutoDemoScript(random = Math.random) {
  const index = Math.floor(random() * autoDemoScripts.length);
  return autoDemoScripts[index];
}
