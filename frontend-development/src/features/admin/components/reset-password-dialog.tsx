import { KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  SidePanelDialog,
  SidePanelDialogBody,
  SidePanelDialogFooter,
  SidePanelDialogHeader
} from '../../../components/ui/side-panel-dialog';
import type { ManagedUser } from '../types/admin.types';

interface ResetPasswordDialogProps {
  open: boolean;
  user: ManagedUser | null;
  isSubmitting?: boolean;
  errorMessage?: string;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<void> | void;
}

export const ResetPasswordDialog = ({
  open,
  user,
  isSubmitting = false,
  errorMessage,
  onClose,
  onSubmit
}: ResetPasswordDialogProps) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      setConfirm('');
      setLocalError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    setLocalError(null);
    if (password.length < 6) {
      setLocalError('Password baru minimal 6 karakter.');
      return;
    }
    if (password !== confirm) {
      setLocalError('Konfirmasi password tidak cocok.');
      return;
    }
    await onSubmit(password);
  };

  const inputClass =
    'w-full rounded-lg border border-[#eceef0] bg-white px-3 py-2 text-sm text-[#191c1e] shadow-sm placeholder:text-[#737784]/70 focus:border-[#003c90]/40 focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
  const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#737784]';

  return (
    <SidePanelDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <SidePanelDialogHeader
        title="Reset Password"
        description={user ? `Reset password untuk ${user.email}` : 'Reset password user'}
      />
      <SidePanelDialogBody>
        <div className="space-y-4">
          {user && (
            <div className="rounded-xl border border-[#003c90]/15 bg-[#d5e3fc]/40 p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#737784]">Target User</p>
              <p className="mt-0.5 text-sm font-bold text-[#191c1e]">{user.name}</p>
              <p className="font-mono text-xs text-[#003c90]">{user.email}</p>
            </div>
          )}

          <div>
            <label className={labelClass}>Password Baru</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className={inputClass}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className={labelClass}>Konfirmasi Password</label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ketik ulang password baru"
              className={inputClass}
              autoComplete="new-password"
            />
          </div>

          {(localError || errorMessage) && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {localError ?? errorMessage}
            </div>
          )}

          <p className="text-[11px] text-[#737784]">
            Setelah reset, user yang sedang login dengan password lama tidak otomatis logout. Beritahu user
            untuk login ulang dengan password baru.
          </p>
        </div>
      </SidePanelDialogBody>
      <SidePanelDialogFooter>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-[#c3c6d5] bg-white px-4 py-2 text-sm font-semibold text-[#191c1e] transition-colors hover:bg-[#f2f4f6] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <KeyRound className="h-4 w-4" />
            {isSubmitting ? 'Mereset...' : 'Reset Password'}
          </button>
        </div>
      </SidePanelDialogFooter>
    </SidePanelDialog>
  );
};
