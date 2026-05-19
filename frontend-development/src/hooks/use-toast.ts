import { useCallback, useRef, useState } from 'react';

export const TOAST_SHOW_DELAY_MS = 400;

export type ToastVariant = 'success' | 'error';

export const useToast = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [variant, setVariant] = useState<ToastVariant>('success');
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    setMessage(null);
  }, []);

  const show = useCallback((text: string, options?: { variant?: ToastVariant }) => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
    }
    const nextVariant = options?.variant ?? 'success';
    showTimerRef.current = setTimeout(() => {
      setVariant(nextVariant);
      setMessage(text);
      showTimerRef.current = null;
    }, TOAST_SHOW_DELAY_MS);
  }, []);

  return { message, variant, dismiss, show };
};
