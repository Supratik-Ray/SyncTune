import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Sparkles } from "lucide-react";
import { ChatMessage, User } from "../types";

interface ChatBoxProps {
  messages: ChatMessage[];
  currentUser: User | null;
  onSendMessage: (text: string) => void;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  currentUser,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-surface-card border-l border-surface-border w-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-brand-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Room Chat ({messages.length})
          </h3>
        </div>
        <span className="text-[10px] text-zinc-500">Live with room</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-zinc-500 space-y-2">
            <div className="w-10 h-10 rounded-full bg-surface-highlight flex items-center justify-center text-brand-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-zinc-300">No messages yet</p>
            <p className="text-[11px] text-zinc-500 max-w-[190px]">
              Say hello or suggest songs to your friends in the room!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.socketId === currentUser?.socketId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {/* Sender info */}
                <div className="flex items-center space-x-1.5 mb-1 px-1">
                  <span
                    className={`text-[11px] font-semibold ${
                      isMe ? "text-brand-400" : "text-zinc-400"
                    }`}
                  >
                    {isMe ? "You" : msg.sender.nickname}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs break-words shadow-sm leading-relaxed ${
                    isMe
                      ? "bg-brand-500 text-black font-medium rounded-tr-sm"
                      : "bg-surface-highlight border border-surface-border text-zinc-100 rounded-tl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-surface-border bg-surface-card flex items-center space-x-2"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          maxLength={300}
          className="flex-1 px-3.5 py-2 bg-surface-base border border-surface-border rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          title="Send message"
          className="p-2 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-black transition-all active:scale-95 flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
