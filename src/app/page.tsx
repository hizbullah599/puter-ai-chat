"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";
import InputArea from "@/components/InputArea";
import ConfirmationModal from "@/components/ConfirmationModal";

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
        content: "How can I help you?", 
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
  }, [selectedModel]);

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

  const confirmClearChat = () => {
    setMessages([{ 
      role: "ai", 
      content: "How can I help you?", 
      type: "text", 
      id: Date.now().toString() 
    }]);
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
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        availableModels={availableModels}
        onClearChat={() => setShowClearConfirm(true)}
      />

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
          <ChatArea 
            messages={messages}
            isLoading={isLoading}
            isGeneratingImage={isGeneratingImage}
            onStopGeneration={handleStopGeneration}
            onCopyToClipboard={copyToClipboard}
            messagesEndRef={messagesEndRef}
          />

          <InputArea 
            mode={mode}
            setMode={setMode}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isGeneratingImage={isGeneratingImage}
            handleKeyDown={handleKeyDown}
          />
        </div>
      </main>

      <ConfirmationModal 
        show={showClearConfirm}
        onConfirm={confirmClearChat}
        onCancel={() => setShowClearConfirm(false)}
        title="Clear Chat History?"
        message="This will permanently delete all messages in this conversation. This action cannot be undone."
      />
    </div>
  );
}
