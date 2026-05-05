import { RefreshCcw, Save, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSystemConfig } from '../hooks/use-system-config';
import type { SystemConfig } from '../types/admin.types';

type Editable = Omit<SystemConfig, 'updatedAt'>;

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
};

export const SystemSettingsPage = () => {
  const { config, isLoading, error, save, reset } = useSystemConfig();
  const [draft, setDraft] = useState<Editable | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (config) {
      const { updatedAt: _ts, ...rest } = config;
      void _ts;
      setDraft(rest);
    }
  }, [config]);

  const handleChange = <K extends keyof Editable>(key: K, value: Editable[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await save(draft);
      setFeedback({ tone: 'success', message: 'Konfigurasi sistem tersimpan.' });
    } catch (e) {
      setFeedback({
        tone: 'error',
        message: e instanceof Error ? e.message : 'Gagal menyimpan konfigurasi'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    const confirm = window.confirm('Reset konfigurasi sistem ke default? Semua perubahan akan hilang.');
    if (!confirm) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await reset();
      setFeedback({ tone: 'success', message: 'Konfigurasi di-reset ke default.' });
    } catch (e) {
      setFeedback({
        tone: 'error',
        message: e instanceof Error ? e.message : 'Gagal reset konfigurasi'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-[#eceef0] bg-white px-3 py-2 text-sm text-[#191c1e] shadow-sm focus:border-[#003c90]/40 focus:outline-none focus:ring-2 focus:ring-[#1d59c1]/20';
  const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#737784]';

  if (isLoading || !config || !draft) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white px-6 py-10 text-center text-sm text-[#737784]">
        Memuat konfigurasi sistem...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">System Settings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Konfigurasi global aplikasi — organisasi, sesi, audit trail, dan flag operasional. Akses Superadmin
            saja.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg border border-[#c3c6d5] bg-white px-3 py-2 text-xs font-semibold text-[#191c1e] transition-colors hover:bg-[#f2f4f6] disabled:opacity-50"
        >
          <RefreshCcw className="h-3.5 w-3.5" /> Reset ke Default
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </div>
      )}

      {feedback && (
        <div
          className={
            feedback.tone === 'success'
              ? 'rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700'
              : 'rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700'
          }
        >
          {feedback.message}
        </div>
      )}

      <section className="rounded-xl border border-[#eceef0] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737784]">Identitas Organisasi</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Nama Organisasi</label>
            <input
              type="text"
              value={draft.organizationName}
              onChange={(e) => handleChange('organizationName', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Kode Organisasi</label>
            <input
              type="text"
              value={draft.organizationCode}
              onChange={(e) => handleChange('organizationCode', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Versi Aplikasi</label>
            <input
              type="text"
              value={draft.appVersion}
              onChange={(e) => handleChange('appVersion', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Default Locale</label>
            <select
              value={draft.defaultLocale}
              onChange={(e) => handleChange('defaultLocale', e.target.value as Editable['defaultLocale'])}
              className={inputClass}
            >
              <option value="id-ID">Indonesia (id-ID)</option>
              <option value="en-US">English (en-US)</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#eceef0] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737784]">Sesi & Keamanan</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Session Timeout (menit)</label>
            <input
              type="number"
              min={5}
              max={1440}
              value={draft.sessionTimeoutMinutes}
              onChange={(e) =>
                handleChange('sessionTimeoutMinutes', Math.max(5, Number(e.target.value) || 60))
              }
              className={inputClass}
            />
            <p className="mt-1 text-[11px] text-[#737784]">Range 5–1440 menit. Default 60 menit.</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[#eceef0] bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#737784]">Flag Operasional</h2>
        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3 rounded-lg border border-[#eceef0] bg-white p-3 hover:bg-[#f8fafc]">
            <input
              type="checkbox"
              checked={draft.enableAuditTrail}
              onChange={(e) => handleChange('enableAuditTrail', e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#191c1e]">Audit Trail</p>
              <p className="text-xs text-[#737784]">
                Catat setiap aksi penting (approval, perubahan KPI, edit data) ke log auditable.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-[#eceef0] bg-white p-3 hover:bg-[#f8fafc]">
            <input
              type="checkbox"
              checked={draft.enableEmailNotifications}
              onChange={(e) => handleChange('enableEmailNotifications', e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-[#191c1e]">Email Notifications</p>
              <p className="text-xs text-[#737784]">
                Aktifkan pengiriman email notifikasi (approval pending, KPI finalize, dll). Memerlukan SMTP
                backend.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 hover:bg-amber-50">
            <input
              type="checkbox"
              checked={draft.maintenanceMode}
              onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">Maintenance Mode</p>
              <p className="text-xs text-amber-700">
                Saat aktif, hanya Superadmin yang bisa login. Role lain melihat halaman maintenance.
              </p>
            </div>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eceef0] bg-[#f8fafc] px-4 py-3">
        <p className="flex items-center gap-2 text-xs text-[#737784]">
          <ShieldCheck className="h-3.5 w-3.5" />
          Terakhir diperbarui: <span className="font-semibold text-[#191c1e]">{formatDateTime(config.updatedAt)}</span>
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#003c90_0%,#0f52ba_100%)] px-5 py-2 text-sm font-bold text-white shadow-md shadow-[#003c90]/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Menyimpan...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};
