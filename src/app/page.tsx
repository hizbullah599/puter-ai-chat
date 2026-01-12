"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: "user" | "ai";
  content: string;
  type: "text" | "image";
  id: string;
}

interface AIModel {
  id: string;
  name?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [mode, setMode] = useState<'chat' | 'image'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<boolean>(false);

  // Load messages from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('hizb_chat_messages');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved messages", e);
      }
    } else {
      setMessages([{ 
        role: "ai", 
        content: "Hello! I'm your Puter-powered AI assistant. How can I help you today?", 
        type: "text",
        id: 'initial'
      }]);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('hizb_chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (typeof puter !== 'undefined') {
          const signedIn = await puter.auth.isSignedIn();
          setIsSignedIn(signedIn);

          const models = await puter.ai.listModels();
          if (models && models.length > 0) {
            setAvailableModels(models);
            if (!models.find((m: AIModel) => m.id === selectedModel)) {
              setSelectedModel(models[0].id);
            }
          } else {
            setAvailableModels([{ id: "gpt-4o", name: "GPT-4o" }, { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" }]);
          }
        }
      } catch (err) {
        console.error("Auth/Model check failed:", err);
      }
    };
    
    const interval = setInterval(() => {
      if (typeof puter !== 'undefined') {
        checkAuth();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    try {
      await puter.auth.signIn();
      setIsSignedIn(await puter.auth.isSignedIn());
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isGeneratingImage]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { role: "user", content: userMessage, type: "text", id: userMsgId }]);
    setIsLoading(true);
    abortControllerRef.current = false;

    try {
      if (typeof puter === 'undefined') {
        throw new Error("Puter.js is not loaded.");
      }

      if (!(await puter.auth.isSignedIn())) {
        setMessages((prev) => [...prev, { role: "ai", content: "Please sign in to Puter.", type: "text", id: Date.now().toString() }]);
        setIsLoading(false);
        return;
      }

      const response = await puter.ai.chat(userMessage, { model: selectedModel, stream: true });
      
      let fullResponse = "";
      const aiMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { role: "ai", content: "", type: "text", id: aiMsgId }]);

      if (!response || typeof response[Symbol.asyncIterator] !== 'function') {
        const text = response?.text || (typeof response === 'string' ? response : JSON.stringify(response));
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.id === aiMsgId) lastMsg.content = text;
          return [...newMessages];
        });
        return;
      }

      for await (const part of response) {
        if (abortControllerRef.current) break;
        fullResponse += part?.text || "";
        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.id === aiMsgId) lastMsg.content = fullResponse;
          return [...newMessages];
        });
      }
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: "ai", content: `Error: ${error.message}`, type: "text", id: Date.now().toString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!input.trim() || isGeneratingImage) return;

    const prompt = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: `(Image Prompt): ${prompt}`, type: "text", id: Date.now().toString() }]);
    setIsGeneratingImage(true);

    try {
      if (typeof puter === 'undefined') throw new Error("Puter.js not loaded");
      if (!(await puter.auth.isSignedIn())) {
        setMessages((prev) => [...prev, { role: "ai", content: "Please sign in.", type: "text", id: Date.now().toString() }]);
        setIsGeneratingImage(false);
        return;
      }

      const image = await puter.ai.txt2img(prompt);
      setMessages((prev) => [...prev, { role: "ai", content: image.src, type: "image", id: Date.now().toString() }]);
    } catch (error: any) {
      setMessages((prev) => [...prev, { role: "ai", content: `Image Error: ${error.message}`, type: "text", id: Date.now().toString() }]);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'chat') await handleSendMessage();
    else await handleGenerateImage();
  };

  const handleStopGeneration = () => {
    abortControllerRef.current = true;
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearChat = () => {
    if (confirm("Clear chat?")) {
      setMessages([{ role: "ai", content: "Chat cleared. How can I help?", type: "text", id: 'cleared' }]);
      localStorage.removeItem('hizb_chat_messages');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <main className="chat-container">
      <header className="header-main glass-morphism">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", background: "linear-gradient(to right, #8b5cf6, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            HIZB.DEV AI Chat
          </h1>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Powered by Puter.js</p>
        </div>
        <div className="controls">
          {isSignedIn === false && (
            <button className="btn-primary" onClick={handleLogin}>Sign In</button>
          )}
          
          <div className="mode-toggle glass-morphism">
            <button className={mode === 'chat' ? 'active' : ''} onClick={() => setMode('chat')} title="Chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </button>
            <button className={mode === 'image' ? 'active' : ''} onClick={() => setMode('image')} title="Image">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            </button>
          </div>

          <button className="btn-secondary" onClick={clearChat} style={{ width: "36px", padding: "0" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>

          {mode === 'chat' && (
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {availableModels.map((m) => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
            </select>
          )}
        </div>
      </header>

      <div className="messages-area glass-morphism">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.type === "text" ? (
              <>
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
                {msg.role === 'ai' && (
                  <button className="copy-btn" onClick={() => copyToClipboard(msg.content)}>
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
              {isLoading && <button onClick={handleStopGeneration} className="btn-secondary" style={{ height: "24px", padding: "0 8px" }}>Stop</button>}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container glass-morphism">
        <div className="input-row">
          <textarea
            placeholder={mode === 'chat' ? "Ask anything..." : "Describe an image..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button className="btn-primary" onClick={handleSubmit} disabled={isLoading || isGeneratingImage || !input.trim()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </main>
  );
}
