import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { HandoverUpdateFormSections } from '../components/update/handover-update-form-sections';
import { HandoverUpdateHeader } from '../components/update/handover-update-header';
import { HandoverUpdateQuickNavigation } from '../components/update/handover-update-quick-navigation';
import { useHandoverDetail } from '../hooks/use-handover-detail';
import type { HandoverDetail } from '../types/handover.types';

export const HandoverUpdatePage = () => {
  const navigate = useNavigate();
  const { handoverId } = useParams();
  const { detail, isLoading } = useHandoverDetail(handoverId);
  const [form, setForm] = useState<HandoverDetail | undefined>();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#eceef0] bg-white p-4 text-sm text-[#737784] shadow-sm">
        Loading handover form...
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

  const activeForm = form ?? detail;

  return (
    <div className="space-y-5">
      <HandoverUpdateHeader onBack={() => navigate(`/handover/${detail.id}`)} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12 md:gap-6">
        <HandoverUpdateQuickNavigation />
        <HandoverUpdateFormSections form={activeForm} onChange={setForm} />
      </div>
    </div>
  );
};
