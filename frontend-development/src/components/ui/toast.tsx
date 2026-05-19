import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ToastVariant } from '../../hooks/use-toast';

interface ToastProps {
  open: boolean;
  message: string;
  onClose: () => void;
  variant?: ToastVariant;
  /** Auto-dismiss after this many ms; set 0 to disable. */
  durationMs?: number;
}

export const Toast = ({ open, message, onClose, variant = 'success', durationMs = 5000 }: ToastProps) => {
  useEffect(() => {
    if (!open || durationMs <= 0) return;
    const timer = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(timer);
  }, [open, durationMs, onClose]);

  if (!open) {
    return null;
  }

  const isError = variant === 'error';

  return createPortal(
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`pointer-events-auto fixed bottom-6 right-6 z-[9999] flex w-[min(calc(100vw-3rem),24rem)] items-start gap-3 rounded-xl border border-[#eceef0] bg-white px-4 py-3.5 shadow-sm motion-safe:animate-[toast-in_0.3s_ease-out] ${
        isError ? 'border-l-4 border-l-red-600' : 'border-l-4 border-l-[#003c90]'
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" strokeWidth={2} aria-hidden />
      ) : (
        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#003c90]" strokeWidth={2} aria-hidden />
      )}
      <p className="flex-1 text-sm font-semibold leading-snug text-[#191c1e]">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-md p-0.5 text-[#737784] transition-colors hover:bg-[#eceef0] hover:text-[#191c1e]"
        aria-label="Tutup"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>,
    document.body
  );
};
