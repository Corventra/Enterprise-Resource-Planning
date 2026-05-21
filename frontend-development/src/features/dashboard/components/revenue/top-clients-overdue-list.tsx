import type { RevenueAttentionItem } from '../../types/revenue-analytics.types';
import { formatDashboardCurrency, formatDashboardDate, formatDashboardNumber } from '../../utils/format-dashboard';
import { CeoEmptyState } from '../ceo/ceo-dashboard-ui';
import { RankedHorizontalBarList } from '../ranked-horizontal-bar-list';

const formatClientSubtitle = (client: RevenueAttentionItem) => {
  const parts: string[] = [];
  parts.push(`${formatDashboardNumber(client.overdue_term_count)} termin overdue`);

  if (client.max_days_overdue > 0) {
    parts.push(`tertua ${formatDashboardNumber(client.max_days_overdue)} hari`);
  } else if (client.oldest_due_date) {
    parts.push(`jatuh tempo tertua ${formatDashboardDate(client.oldest_due_date)}`);
  }

  return parts.join(' · ');
};

interface TopClientsOverdueListProps {
  clients: RevenueAttentionItem[];
}

export const TopClientsOverdueList = ({ clients }: TopClientsOverdueListProps) => {
  if (clients.length === 0) {
    return (
      <CeoEmptyState
        message="Tidak ada klien dengan overdue pada akhir periode ini."
        hint="Semua tagihan yang sudah dikirim ke klien dan lewat jatuh tempo telah tertagih atau belum memenuhi kriteria overdue."
      />
    );
  }

  return (
    <RankedHorizontalBarList
      items={clients.map((client) => ({
        name: client.client_name,
        value: client.overdue_amount,
        subtitle: formatClientSubtitle(client)
      }))}
      valueFormatter={formatDashboardCurrency}
      accentClass="from-[#ba1a1a] to-[#d94a4a]"
      uniformAccent
      maxItems={5}
    />
  );
};
