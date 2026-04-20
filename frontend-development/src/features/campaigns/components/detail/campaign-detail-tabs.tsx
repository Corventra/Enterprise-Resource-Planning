type CampaignDetailTab = 'forms' | 'submissions';

interface CampaignDetailTabsProps {
  activeTab: CampaignDetailTab;
  onChangeTab: (tab: CampaignDetailTab) => void;
  formsCount: number;
  submissionsCount: number;
}

export const CampaignDetailTabs = ({
  activeTab,
  onChangeTab,
  formsCount,
  submissionsCount
}: CampaignDetailTabsProps) => {
  const tabs: Array<{ key: CampaignDetailTab; label: string }> = [
    { key: 'forms', label: `Forms (${formsCount})` },
    { key: 'submissions', label: `Submissions (${submissionsCount})` }
  ];

  return (
    <div className="border-b border-gray-200 px-4 sm:px-5">
      <div className="flex gap-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChangeTab(tab.key)}
            className={`border-b-2 py-3 text-xs font-medium transition-colors sm:text-sm ${
              activeTab === tab.key
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export type { CampaignDetailTab };
