import { ArrowRight, ListChecks, Sliders } from 'lucide-react';
import { Link } from 'react-router';
import { PERMISSIONS, type Permission } from '../../../app/permissions';
import { useAuth } from '../../../app/store/auth-store';

interface SettingsCardDef {
  to: string;
  title: string;
  description: string;
  icon: typeof Sliders;
  iconClass: string;
  requiredPermissions: Permission[];
}

const cards: SettingsCardDef[] = [
  {
    to: '/settings/kpi-config',
    title: 'KPI Configuration',
    description:
      'Atur bobot 4 dimensi KPI, threshold on-time tolerance, dan target update gap. HRD primary owner — perubahan major (bobot dimensi) di-approve CEO.',
    icon: Sliders,
    iconClass: 'text-[#003c90] bg-[#003c90]/10',
    requiredPermissions: [PERMISSIONS.KPI_CONFIGURE]
  },
  {
    to: '/settings/task-templates',
    title: 'Task Templates',
    description:
      'Kelola task default per service line (TP / Tax / Advisory / Audit). Collaborative HRD + COO — task list di-clone otomatis saat COO assign PM.',
    icon: ListChecks,
    iconClass: 'text-[#a16207] bg-amber-100',
    requiredPermissions: [PERMISSIONS.TASK_TEMPLATE_MANAGE]
  }
];

export const SettingsPage = () => {
  const { canAny } = useAuth();
  const visibleCards = cards.filter((card) => canAny(card.requiredPermissions));

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Konfigurasi sistem KPI dan task template. Akses per-card disesuaikan dengan permission Anda.
        </p>
      </header>

      {visibleCards.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-white px-6 py-16 text-center shadow-sm ring-1 ring-[#eceef0]">
          <h3 className="text-lg font-semibold text-[#191c1e]">No settings available</h3>
          <p className="max-w-md text-sm text-[#737784]">
            Anda tidak memiliki permission untuk mengubah settings sistem. Hubungi HRD atau COO untuk
            perubahan KPI Config / Task Template.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className="group flex flex-col gap-3 rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#eceef0] transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className={`rounded-full p-2.5 ${card.iconClass}`}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#737784] transition-transform group-hover:translate-x-1 group-hover:text-[#003c90]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#191c1e] transition-colors group-hover:text-[#003c90]">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#737784]">{card.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};
