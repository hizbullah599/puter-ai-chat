"use client";

interface ConfirmationModalProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
}

export default function ConfirmationModal({
  show,
  onConfirm,
  onCancel,
  title,
  message
}: ConfirmationModalProps) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-morphism">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button 
            className="btn-secondary" 
            onClick={onCancel}
            style={{ width: 'auto' }}
          >
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={onConfirm}
            style={{ width: 'auto', background: '#ef4444', color: 'white', padding: '12px 28px', fontWeight: '700', fontSize: '1rem' }}
          >
            Clear Chat
          </button>
        </div>
      </div>
    </div>
  );
}
