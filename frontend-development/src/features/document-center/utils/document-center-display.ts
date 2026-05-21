import { File, FileImage, FileSpreadsheet, FileText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { leadStageLabelMap, type LeadStage } from '../../lead-tracker/types/lead-tracker.types';
import type { DocumentCenterTag } from '../types/document-center.types';

export const formatDocumentCenterDate = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatDocumentCenterDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
};

export const leadStageDisplay = (stage: string): string => {
  const key = stage as LeadStage;
  return leadStageLabelMap[key] ?? stage.replace(/_/g, ' ');
};

export const documentTagLabel: Record<DocumentCenterTag, string> = {
  LATEST: 'Latest',
  SIGNED: 'Signed',
  FINAL: 'Final',
  CLIENT_PROVIDED: 'Client Provided',
  PAYMENT_PROOF: 'Payment Proof'
};

export const documentTagClass: Record<DocumentCenterTag, string> = {
  LATEST: 'bg-[#006544] text-white',
  SIGNED: 'bg-[#006544]/10 text-[#006544]',
  FINAL: 'bg-[#434653]/10 text-[#434653]',
  CLIENT_PROVIDED: 'bg-[#a16207]/10 text-[#a16207]',
  PAYMENT_PROOF: 'bg-[#0f52ba]/10 text-[#0f52ba]'
};

export const fileTypeLabel = (ext: string | null | undefined, mime: string | null | undefined): string => {
  const e = (ext ?? '').toLowerCase();
  const m = (mime ?? '').toLowerCase();
  if (e === 'pdf' || m.includes('pdf')) return 'PDF Document';
  if (['doc', 'docx'].includes(e) || m.includes('word')) return 'Word Document';
  if (['xls', 'xlsx', 'csv'].includes(e) || m.includes('sheet') || m.includes('excel')) return 'Spreadsheet';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e) || m.startsWith('image/')) return 'Image';
  if (e) return `${e.toUpperCase()} File`;
  return 'Document';
};

export const fileIconToneForExtension = (
  ext: string | null | undefined
): { iconClass: string; wrapClass: string } => {
  const e = (ext ?? '').toLowerCase();
  if (e === 'pdf') return { iconClass: 'text-[#dc2626]', wrapClass: 'bg-[#fef2f2]' };
  if (['doc', 'docx'].includes(e)) return { iconClass: 'text-[#2563eb]', wrapClass: 'bg-[#eff6ff]' };
  if (['xls', 'xlsx', 'csv'].includes(e)) return { iconClass: 'text-[#16a34a]', wrapClass: 'bg-[#f0fdf4]' };
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e)) {
    return { iconClass: 'text-[#7c3aed]', wrapClass: 'bg-[#f5f3ff]' };
  }
  return { iconClass: 'text-[#434653]', wrapClass: 'bg-[#f2f4f6]' };
};

export const formatUploaderShortName = (fullName: string | null | undefined): string => {
  if (!fullName?.trim()) return '—';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() ?? '';
  return `${parts[0]} ${lastInitial}.`;
};

export const uploaderInitials = (name: string | null | undefined): string => {
  if (!name?.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
};

export const fileRowSubtitle = (item: { sourceModule: string; termName?: string | null }): string => {
  if (item.termName?.trim()) return item.termName.trim();
  return item.sourceModule;
};

export const fileIconForExtension = (ext: string | null | undefined): LucideIcon => {
  const e = (ext ?? '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e)) return FileImage;
  if (['xls', 'xlsx', 'csv'].includes(e)) return FileSpreadsheet;
  if (['pdf', 'doc', 'docx', 'txt'].includes(e)) return FileText;
  return File;
};

export const matchesLastUpdatedFilter = (
  iso: string | null,
  range: 'All' | '7d' | '30d' | '90d'
): boolean => {
  if (range === 'All' || !iso) return range === 'All' ? true : false;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(iso).getTime() >= cutoff;
};

export const matchesFileTypeFilter = (
  ext: string | null,
  mime: string | null,
  filter: 'All' | 'pdf' | 'doc' | 'image' | 'spreadsheet' | 'other'
): boolean => {
  if (filter === 'All') return true;
  const e = (ext ?? '').toLowerCase();
  const m = (mime ?? '').toLowerCase();
  if (filter === 'pdf') return e === 'pdf' || m.includes('pdf');
  if (filter === 'doc') return ['doc', 'docx'].includes(e) || m.includes('word');
  if (filter === 'image') return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e) || m.startsWith('image/');
  if (filter === 'spreadsheet') return ['xls', 'xlsx', 'csv'].includes(e) || m.includes('sheet') || m.includes('excel');
  return !['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'xls', 'xlsx', 'csv'].includes(e);
};
