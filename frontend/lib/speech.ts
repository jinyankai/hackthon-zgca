export type SpeechStatus = "idle" | "recording" | "transcribing" | "transcript_ready" | "failed";

export interface BrowserSpeechRecognitionResultEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

export interface BrowserSpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onspeechend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionResultEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

export type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

export function getSpeechRecognition() {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

const serviceCorrections: Array<[RegExp, string]> = [
  [/退快/g, "退款"],
  [/差品/g, "差评"],
  [/配宋/g, "配送"],
  [/送大/g, "送达"],
  [/核食/g, "核实"],
  [/和实/g, "核实"],
  [/订丹/g, "订单"],
  [/订单壮态/g, "订单状态"],
  [/规泽/g, "规则"],
  [/平台鬼则/g, "平台规则"],
  [/别寄/g, "别急"],
  [/表急/g, "别急"],
];

export function normalizeServiceSpeechTranscript(raw: string) {
  let text = raw.trim().replace(/\s+/g, "");
  const corrections: string[] = [];

  for (const [pattern, replacement] of serviceCorrections) {
    if (pattern.test(text)) {
      text = text.replace(pattern, replacement);
      corrections.push(replacement);
    }
  }

  return {
    text,
    corrections: Array.from(new Set(corrections)),
  };
}

export function voiceLabel(status: SpeechStatus) {
  if (status === "recording") return "正在录音";
  if (status === "transcribing") return "正在转写";
  if (status === "transcript_ready") return "转写已填入，可编辑后再发送";
  if (status === "failed") return "语音不可用，可改用文本";
  return "可语音输入";
}

export async function transcribeViaBackend(audioBlob: Blob): Promise<{ ok: boolean; text: string; error?: string }> {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");

  try {
    const resp = await fetch("http://localhost:8000/api/transcribe", {
      method: "POST",
      body: formData,
    });
    return await resp.json();
  } catch {
    return { ok: false, text: "", error: "network_error" };
  }
}
