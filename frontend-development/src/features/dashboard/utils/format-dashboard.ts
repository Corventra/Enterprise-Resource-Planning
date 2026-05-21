export const formatDashboardNumber = (value: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(value);

export const formatDashboardCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);

/**
 * Batas atas sumbu chart — cukup headroom (~12%), tidak melonjak 2× seperti niceMax kasar.
 * Contoh: puncak 218M → skala ~250M, bukan 500M.
 */
export const chartAxisMaxForPeak = (peak: number, padRatio = 1.12) => {
  if (peak <= 0) return 4;
  const padded = peak * padRatio;
  const exp = 10 ** Math.floor(Math.log10(padded));
  const fraction = padded / exp;
  const niceSteps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const step = niceSteps.find((n) => n >= fraction) ?? 10;
  return step * exp;
};

/** Sumbu chart — selalu prefix IDR (hindari campur Rp / IDR). */
export const formatDashboardAxisCurrency = (value: number) => {
  if (value === 0) return 'IDR 0';
  return formatDashboardCurrencyCompact(value);
};

/** Ringkas untuk panel executive (mis. IDR 80M). */
export const formatDashboardCurrencyCompact = (value: number) => {
  const abs = Math.abs(value);
  if (abs === 0) return 'IDR 0';
  if (abs >= 1_000_000_000) {
    const n = value / 1_000_000_000;
    return `IDR ${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    const n = value / 1_000_000;
    return `IDR ${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    const n = value / 1_000;
    return `IDR ${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}K`;
  }
  return `IDR ${formatDashboardNumber(value)}`;
};

export const formatDashboardPercent = (value: number) => `${value.toLocaleString('id-ID')}%`;

export const formatDashboardDate = (value: string | null) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};
