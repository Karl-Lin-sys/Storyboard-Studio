import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { Send, Bot, User, MessageCircle } from "lucide-react";
import { ChatMessage } from "../types";

export function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: "Hello, I'm your AI Director. I can help brainstorm shot composition, write script dialogue, or consult on storyboarding. What are we working on?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modelType, setModelType] = useState<"flash" | "pro" | "lite">("flash");
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: ChatMessage = { role: "user", text: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: messages,
          message: userMsg.text,
          modelType,
        }),
      });
      const data = await res.json();
      
      if (data.text) {
        setMessages([...newMessages, { role: "model", text: data.text }]);
      } else {
        throw new Error("Invalid response");
      }
    } catch (e) {
      console.error(e);
      setMessages([
        ...newMessages,
        { role: "model", text: "I'm sorry, I encountered an error while processing that." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          AI Director
        </h2>
        <select
          value={modelType}
          onChange={(e) => setModelType(e.target.value as "flash" | "pro" | "lite")}
          className="px-2 py-1 bg-white border border-gray-300 rounded text-xs focus:ring-blue-500"
          title="Choose model speed vs reasoning"
        >
          <option value="lite">Fast (Flash-Lite)</option>
          <option value="flash">Standard (Flash)</option>
          <option value="pro">Pro (Complex Reasoning)</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="flex flex-col max-w-2xl mx-auto divide-y divide-gray-100">
          {messages.map((m, i) => (
            <div key={i} className={`p-4 flex gap-4 ${m.role === "model" ? "bg-gray-50/50" : "bg-white"}`}>
              <div className={`mt-1 shrink-0 w-8 h-8 flex items-center justify-center rounded ${m.role === "model" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                {m.role === "model" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <div className="markdown-body">
                  {m.role === "model" ? (
                    <Markdown>{m.text}</Markdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="p-4 flex gap-4 bg-gray-50/50">
              <div className="mt-1 shrink-0 w-8 h-8 flex items-center justify-center rounded bg-blue-100 text-blue-700">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-4 py-1">
                <div className="flex space-x-1 items-center h-4">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <div className="relative flex items-center max-w-2xl mx-auto">
          <input
            type="text"
            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors text-sm"
            placeholder="Ask for feedback or description logic..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-1 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 w-9 h-9 flex items-center justify-center rounded-full transition-colors"
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
