"use client";

interface AIModel {
  id: string;
  name?: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  availableModels: AIModel[];
  onClearChat: () => void;
}

export default function Sidebar({ 
  isOpen, 
  onClose, 
  selectedModel, 
  onModelChange, 
  availableModels, 
  onClearChat 
}: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? '' : 'closed'}`}>
      <div className="sidebar-header">
        <span style={{ fontWeight: 'bold' }}>Settings</span>
        <button onClick={onClose} style={{ padding: '4px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
        </button>
      </div>
      <div className="sidebar-content">
        <div className="sidebar-section">
          <span className="sidebar-label">AI Model</span>
          <select value={selectedModel} onChange={(e) => onModelChange(e.target.value)}>
            {availableModels.map((m) => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
          </select>
        </div>
        
        <div className="sidebar-section">
          <span className="sidebar-label">Actions</span>
          <button className="btn-secondary" onClick={onClearChat}>
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
  );
}
