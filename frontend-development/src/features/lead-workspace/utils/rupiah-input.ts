export const parseRupiahInput = (raw: string) => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) {
    return 0;
  }
  const value = Number(digits);
  return Number.isSafeInteger(value) ? value : 0;
};

export const formatRupiahInput = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }
  return new Intl.NumberFormat('id-ID').format(Math.trunc(value));
};
