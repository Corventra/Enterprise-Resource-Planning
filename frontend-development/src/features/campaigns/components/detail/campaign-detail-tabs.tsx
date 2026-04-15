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
    <div className="border-b border-gray-200 px-6">
      <div className="flex gap-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChangeTab(tab.key)}
            className={`py-4 border-b-2 text-sm font-medium transition-colors ${
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
