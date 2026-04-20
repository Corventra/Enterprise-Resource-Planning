import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { ProposalDetailSection } from '../components/proposal-detail-section';
import { ProposalHistorySection } from '../components/proposal-history-section';
import type { LeadWorkspaceOutletContext } from './lead-workspace-page';

export const ProposalPage = () => {
  const { workspace } = useOutletContext<LeadWorkspaceOutletContext>();
  const proposals = useMemo(() => workspace.proposals, [workspace.proposals]);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(proposals[0]?.id ?? null);

  useEffect(() => {
    if (proposals.length === 0) {
      setSelectedProposalId(null);
      return;
    }

    const isStillAvailable = proposals.some((proposal) => proposal.id === selectedProposalId);
    if (!isStillAvailable) {
      setSelectedProposalId(proposals[0].id);
    }
  }, [proposals, selectedProposalId]);

  const selectedProposal = proposals.find((proposal) => proposal.id === selectedProposalId) ?? proposals[0];

  return (
    <section className="grid grid-cols-12 gap-6">
      <ProposalHistorySection
        proposals={proposals}
        selectedProposalId={selectedProposal?.id}
        onSelectProposal={setSelectedProposalId}
      />
      <ProposalDetailSection proposal={selectedProposal} />
    </section>
  );
};
