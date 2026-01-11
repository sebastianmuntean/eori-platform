'use client';

interface Tab {
  id: string;
  label: string;
}

interface PilgrimageTabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * Reusable tab navigation component for pilgrimage details page
 * Extracted to reduce code duplication
 */
export function PilgrimageTabNavigation({ tabs, activeTab, onTabChange }: PilgrimageTabNavigationProps) {
  return (
    <div className="mb-6">
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}


