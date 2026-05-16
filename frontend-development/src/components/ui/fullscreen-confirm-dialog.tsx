import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface FullscreenConfirmDialogProps {
  open: boolean;
  children: ReactNode;
}

/** Portal ke body agar backdrop fixed menutup seluruh viewport. */
export const FullscreenConfirmDialog = ({ open, children }: FullscreenConfirmDialogProps) => {
  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex min-h-[100dvh] w-screen items-center justify-center bg-slate-900/50 px-4"
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>,
    document.body
  );
};
