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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
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
      if (typeof puter === 'undefined') throw new Error("Puter.js not loaded");
      if (!(await puter.auth.isSignedIn())) {
        setMessages((prev) => [...prev, { role: "ai", content: "Please sign in.", type: "text", id: Date.now().toString() }]);
        setIsLoading(false);
        return;
      }

      const response = await puter.ai.chat(userMessage, { model: selectedModel, stream: true });
      let fullResponse = "";
      const aiMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { role: "ai", content: "", type: "text", id: aiMsgId }]);

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
    setShowClearConfirm(true);
  };

  const confirmClearChat = () => {
    setMessages([{ role: "ai", content: "Chat cleared.", type: "text", id: 'cleared' }]);
    localStorage.removeItem('hizb_chat_messages');
    setShowClearConfirm(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          <span style={{ fontWeight: 'bold' }}>Settings</span>
          <button onClick={() => setIsSidebarOpen(false)} style={{ padding: '4px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <span className="sidebar-label">AI Model</span>
            <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {availableModels.map((m) => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
            </select>
          </div>
          
          <div className="sidebar-section">
            <span className="sidebar-label">Actions</span>
            <button className="btn-secondary" onClick={clearChat}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Clear Chat
            </button>
            <a 
              href="https://github.com/hizbullah599/puter-ai-chat" 
              target="_blank" 
              className="btn-secondary"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              GitHub Repo
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="chat-main">
        <header className="header-main">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="btn-secondary" style={{ width: '40px', padding: '0', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
            )}
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>HIZB.DEV AI</h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Powered by Puter.js</p>
            </div>
          </div>
          <div className="controls">
            {isSignedIn === false ? (
              <button className="btn-primary" onClick={handleLogin} style={{ width: 'auto', padding: '0 16px' }}>Sign In</button>
            ) : (
              <span style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: "600" }}>● Online</span>
            )}
          </div>
        </header>

        <div className="chat-container">
          <div className="messages-area">
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
                  {isLoading && <button onClick={handleStopGeneration} className="btn-secondary" style={{ height: "24px", padding: "0 8px", width: 'auto' }}>Stop</button>}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <div className="mode-toggle-container">
              <div className="mode-toggle">
                <button className={mode === 'chat' ? 'active' : ''} onClick={() => setMode('chat')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  Chat
                </button>
                <button className={mode === 'image' ? 'active' : ''} onClick={() => setMode('image')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                  Image
                </button>
              </div>
            </div>
            
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
        </div>
      </main>

      {/* Confirmation Dialog */}
      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="modal-content glass-morphism">
            <h3>Clear Chat History?</h3>
            <p>This will permanently delete all messages in this conversation. This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setShowClearConfirm(false)}
                style={{ width: 'auto' }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={confirmClearChat}
                style={{ width: 'auto', background: '#ef4444', color: 'white', padding: '12px 28px', fontWeight: '700', fontSize: '1rem' }}
              >
                Clear Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
