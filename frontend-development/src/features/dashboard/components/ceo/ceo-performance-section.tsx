import type { CeoDashboardData } from '../../types/ceo-dashboard.types';
import { formatDashboardCurrency, formatDashboardNumber } from '../../utils/format-dashboard';
import { CeoEmptyState, CeoSectionHeader, ceoPanelClass, ceoSectionClass } from './ceo-dashboard-ui';
import { RankedHorizontalBarList } from '../ranked-horizontal-bar-list';

const RankList = ({
  title,
  items,
  currency = false
}: {
  title: string;
  items: Array<{ name: string; value: number }>;
  currency?: boolean;
}) => (
  <article className={ceoPanelClass}>
    <div className="mb-4 border-b border-[#eceef0] pb-3">
      <h3 className="text-sm font-bold text-[#191c1e]">{title}</h3>
    </div>
    {items.length === 0 ? (
      <CeoEmptyState message="Belum ada data." />
    ) : (
      <RankedHorizontalBarList
        items={items}
        valueFormatter={currency ? formatDashboardCurrency : formatDashboardNumber}
        maxItems={5}
      />
    )}
  </article>
);

export const CeoPerformanceSection = ({ performance }: { performance: CeoDashboardData['performance'] }) => (
  <section className={ceoSectionClass}>
    <CeoSectionHeader
      title="Service Performance Analytics"
      description="Kontribusi service terhadap pipeline & revenue."
    />
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <RankList title="Top Service (Lead)" items={performance.top_services_by_leads} />
      <RankList title="Top Service (Won)" items={performance.top_services_by_won} />
      <RankList title="Top Service (Nilai Invoice)" items={performance.top_services_by_invoice_value} currency />
    </div>
  </section>
);
