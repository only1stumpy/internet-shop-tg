"use client";

import { useState } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface CategoryTabsProps {
  tabs: Tab[];
  onTabChange?: (tabId: string) => void;
}

export default function CategoryTabs({ tabs, onTabChange }: CategoryTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => handleTabClick(tab.id)}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200
            ${
              activeTab === tab.id
                ? "bg-[--indigo-dye] text-white"
                : "bg-[--search] text-gray-400 hover:text-white"
            }
          `}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
