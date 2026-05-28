import { X } from "lucide-react";
import { useEffect } from "react";

export function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-50 w-full max-w-md max-h-[90vh] flex flex-col p-6 bg-card rounded-2xl shadow-xl border border-border animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 pr-2 -mr-2">
          {children}
        </div>
      </div>
    </div>
  );
}
