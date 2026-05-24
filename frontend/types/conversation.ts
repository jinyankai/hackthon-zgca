export type Sender = "customer" | "agent" | "system";
export type InputMode = "text" | "voice" | "script";
export type EmotionLevel = "calm" | "mild" | "angry" | "extreme";

export interface Message {
  id: string;
  conversationId: string;
  sender: Sender;
  text: string;
  createdAt: string;
  inputMode?: InputMode;
  approved?: boolean;
}

export interface SuggestedReply {
  id: string;
  tone: "calm" | "firm" | "empathetic";
  text: string;
}

export interface TranslatedMessage {
  messageId: string;
  originalText: string;
  filteredText: string;
  coreRequest: string;
  emotionLevel: EmotionLevel;
  emotionScore: number;
  riskFlags: string[];
  suggestedReplies: SuggestedReply[];
  originalVisible: boolean;
  approvalNeeded: boolean;
  source?: "llm" | "mock";
}

export interface PolishedReply {
  id: string;
  polishedText: string;
  tone: "calm" | "firm" | "empathetic";
  changesSummary: string;
  missingInfo: string[];
  approvalNeeded: boolean;
  originalVisible: boolean;
  source?: "llm" | "mock";
}

export interface EmotionStatus {
  battery: number;
  status: "healthy" | "warning" | "critical";
  lastUpdatedAt: string;
  restSuggested: boolean;
}

export interface ConversationState {
  conversationId: string;
  messages: Message[];
  latestTranslated?: TranslatedMessage | null;
  latestPolished?: PolishedReply | null;
  emotionStatus: EmotionStatus;
}
