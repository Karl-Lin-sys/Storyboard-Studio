export interface Frame {
  description: string;
  prompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}
