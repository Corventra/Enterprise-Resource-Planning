export const formatLeadDisplayId = (leadId: string | number | null | undefined): string => {
  const n = Number(leadId);
  if (!Number.isInteger(n) || n <= 0) {
    return '-';
  }
  return `LD-${String(n).padStart(3, '0')}`;
};
