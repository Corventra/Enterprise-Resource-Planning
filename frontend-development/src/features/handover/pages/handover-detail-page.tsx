import { useNavigate, useParams } from 'react-router';
import { HandoverDetailHeader } from '../components/detail/handover-detail-header';
import { HandoverDocumentSections } from '../components/detail/handover-document-sections';
import { HandoverQuickNavigation } from '../components/detail/handover-quick-navigation';
import { useHandoverDetail } from '../hooks/use-handover-detail';

export const HandoverDetailPage = () => {
  const navigate = useNavigate();
  const { handoverId } = useParams();
  const { detail, isLoading } = useHandoverDetail(handoverId);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading handover detail...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 shadow-sm">
        <h1 className="text-base font-semibold text-[#191c1e]">Handover not found</h1>
        <button
          type="button"
          onClick={() => navigate('/handover')}
          className="mt-3 rounded-lg border border-[#c3c6d5] px-3 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#eceef0] sm:text-sm"
        >
          Back to Handover List
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <HandoverDetailHeader onBack={() => navigate('/handover')} />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
        <div className="sticky top-20 self-start md:col-span-2">
          <HandoverQuickNavigation />
        </div>
        <div className="md:col-span-10">
          <HandoverDocumentSections detail={detail} />
        </div>
      </div>
    </div>
  );
};
