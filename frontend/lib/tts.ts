export type TTSStatus = "idle" | "speaking" | "paused";

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, onEnd?: () => void): boolean {
  if (!isTTSSupported()) return false;

  stop();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find(
    (v) => v.lang.startsWith("zh") && v.localService
  );
  if (zhVoice) utterance.voice = zhVoice;

  utterance.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };
  utterance.onerror = () => {
    currentUtterance = null;
    onEnd?.();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stop() {
  if (isTTSSupported()) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return isTTSSupported() && window.speechSynthesis.speaking;
}
