import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface SidePanelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

interface SidePanelDialogHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

interface SidePanelDialogBodyProps {
  children: ReactNode;
  className?: string;
}

interface SidePanelDialogFooterProps {
  children: ReactNode;
  className?: string;
}

interface SidePanelDialogContextValue {
  onClose: () => void;
  showCloseButton: boolean;
}

const SidePanelDialogContext = createContext<SidePanelDialogContextValue | null>(null);

const useSidePanelDialogContext = () => {
  const context = useContext(SidePanelDialogContext);
  if (!context) {
    throw new Error('SidePanelDialog components must be used inside SidePanelDialog.');
  }
  return context;
};

export const SidePanelDialog = ({
  open,
  onOpenChange,
  children,
  className = '',
  showCloseButton = true
}: SidePanelDialogProps) => {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return createPortal(
    <SidePanelDialogContext.Provider
      value={{ onClose: () => onOpenChange(false), showCloseButton }}
    >
      <div className="fixed inset-0 z-50 min-h-[100dvh] w-screen bg-slate-900/40" role="presentation">
        <button
          type="button"
          className="absolute inset-0 h-full w-full cursor-default"
          onClick={() => onOpenChange(false)}
          aria-label="Close panel"
        />
        <div className="absolute inset-y-0 right-0 flex h-full w-full justify-end">
          <div
            className={`flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-2xl flex-col overflow-hidden border-l border-slate-200 bg-white shadow-xl ${className}`}
          >
            {children}
          </div>
        </div>
      </div>
    </SidePanelDialogContext.Provider>,
    document.body
  );
};

export const SidePanelDialogHeader = ({
  title,
  description,
  action,
  className = ''
}: SidePanelDialogHeaderProps) => {
  const { onClose, showCloseButton } = useSidePanelDialogContext();

  return (
    <div className={`flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-4 ${className}`}>
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {action}
        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const SidePanelDialogBody = ({ children, className = '' }: SidePanelDialogBodyProps) => {
  return <div className={`min-h-0 flex-1 overflow-y-auto px-6 py-5 ${className}`}>{children}</div>;
};

export const SidePanelDialogFooter = ({ children, className = '' }: SidePanelDialogFooterProps) => {
  return <div className={`shrink-0 border-t border-slate-200 bg-white px-6 py-4 ${className}`}>{children}</div>;
};
