import { formatDashboardNumber } from '../../utils/format-dashboard';
import { INVOICE_TERM_STATUS_META, INVOICE_TERM_STATUS_ORDER } from './invoice-term-status-meta';

export interface InvoiceStatusDistributionRow {
  status: string;
  count: number;
  amount: number;
}

interface InvoiceStatusDistributionChartProps {
  distribution: InvoiceStatusDistributionRow[];
}

type StatusRow = {
  status: string;
  count: number;
  label: string;
  barColor: string;
};

const formatItemCount = (count: number) =>
  `${formatDashboardNumber(count)} ${count === 1 ? 'Item' : 'Items'}`;

const StatusProgressRow = ({ row, maxCount }: { row: StatusRow; maxCount: number }) => {
  const widthPct = row.count > 0 ? Math.max(4, Math.round((row.count / maxCount) * 100)) : 0;

  return (
    <li>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[#191c1e]">{row.label}</span>
        <span className="shrink-0 text-xs font-medium text-[#737784]">{formatItemCount(row.count)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#eef1f6]">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{
            width: `${widthPct}%`,
            backgroundColor: row.count > 0 ? row.barColor : '#dce1ea'
          }}
          title={`${row.label}: ${formatDashboardNumber(row.count)}`}
        />
      </div>
    </li>
  );
};

const StatusColumn = ({ rows, maxCount }: { rows: StatusRow[]; maxCount: number }) => (
  <ul className="space-y-5">
    {rows.map((row) => (
      <StatusProgressRow key={row.status} row={row} maxCount={maxCount} />
    ))}
  </ul>
);

export const InvoiceStatusDistributionChart = ({ distribution }: InvoiceStatusDistributionChartProps) => {
  const byStatus = new Map(distribution.map((row) => [row.status, row]));

  const rows: StatusRow[] = INVOICE_TERM_STATUS_ORDER.map((status) => {
    const row = byStatus.get(status);
    return {
      status,
      count: row?.count ?? 0,
      ...INVOICE_TERM_STATUS_META[status]
    };
  });

  const totalCount = rows.reduce((sum, row) => sum + row.count, 0);
  const maxCount = Math.max(...rows.map((row) => row.count), 1);
  const leftRows = rows.slice(0, 3);
  const rightRows = rows.slice(3, 6);

  if (totalCount <= 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#dce1ea] bg-[#fafbfc] px-4 py-12 text-center">
        <p className="text-sm font-semibold text-[#434653]">Belum ada invoice tercatat</p>
        <p className="mt-1 max-w-xs text-xs text-[#737784]">
          Distribusi status akan tampil setelah ada termin invoice di sistem.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      <StatusColumn rows={leftRows} maxCount={maxCount} />
      <StatusColumn rows={rightRows} maxCount={maxCount} />
    </div>
  );
};
