"use client";

interface InputAreaProps {
  mode: 'chat' | 'image';
  setMode: (mode: 'chat' | 'image') => void;
  input: string;
  setInput: (input: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isGeneratingImage: boolean;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export default function InputArea({
  mode,
  setMode,
  input,
  setInput,
  onSubmit,
  isLoading,
  isGeneratingImage,
  handleKeyDown
}: InputAreaProps) {
  return (
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
        <button className="btn-primary" onClick={onSubmit} disabled={isLoading || isGeneratingImage || !input.trim()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  );
}
