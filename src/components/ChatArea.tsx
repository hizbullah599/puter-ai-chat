"use client";

import Image from "next/image";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: "user" | "ai";
  content: string;
  type: "text" | "image";
  id: string;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  isGeneratingImage: boolean;
  onStopGeneration: () => void;
  onCopyToClipboard: (text: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function ChatArea({
  messages,
  isLoading,
  isGeneratingImage,
  onStopGeneration,
  onCopyToClipboard,
  messagesEndRef
}: ChatAreaProps) {
  return (
    <div className="messages-area">
      {messages.map((msg) => (
        <div key={msg.id} className={`message ${msg.role}`}>
          {msg.type === "text" ? (
            <>
              <div className="markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
              </div>
              {msg.role === 'ai' && (
                <button className="copy-btn" onClick={() => onCopyToClipboard(msg.content)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              )}
            </>
          ) : (
            <Image src={msg.content} alt="AI" width={512} height={512} className="image-output" unoptimized />
          )}
        </div>
      ))}
      {(isLoading || isGeneratingImage) && (
        <div className="message ai">
          <div className="generating-indicator">
            {isLoading ? 'Thinking' : 'Generating Image'}
            <div className="dot-flashing"></div>
            {isLoading && <button onClick={onStopGeneration} className="btn-secondary" style={{ height: "24px", padding: "0 8px", width: 'auto' }}>Stop</button>}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
