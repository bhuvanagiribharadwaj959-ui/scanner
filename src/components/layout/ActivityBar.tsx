'use client';

import React from 'react';
import Link from 'next/link';
import {
  FolderClosed,
  Search,
  GitBranch,
  Play,
  LayoutGrid,
  Sparkles,
  History,
  Settings,
} from 'lucide-react';
import { SidebarTab } from '@/types/github';

interface ActivityBarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
  isScanPanelOpen?: boolean;
  onToggleScanPanel?: () => void;
  isAiAgentOpen?: boolean;
  onToggleAiAgent?: () => void;
  aiVulnCount?: number;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeTab,
  onTabChange,
  isOpen,
  onToggleSidebar,
  isAiAgentOpen,
  onToggleAiAgent,
  aiVulnCount,
}) => {
  const handleItemClick = (tab: SidebarTab) => {
    if (activeTab === tab && isOpen) {
      onToggleSidebar();
    } else {
      onTabChange(tab);
      if (!isOpen) {
        onToggleSidebar();
      }
    }
  };

  return (
    <aside className="vscode-activitybar">
      <div className="activitybar-top">
        {/* 1. Explorer (Active iOS Squircle Pill) */}
        <button
          className={`activitybar-item ${activeTab === 'explorer' && isOpen ? 'active' : ''}`}
          onClick={() => handleItemClick('explorer')}
          title="Explorer (Ctrl+Shift+E)"
          aria-label="Explorer"
        >
          <FolderClosed size={20} />
        </button>

        {/* 2. Search */}
        <button
          className={`activitybar-item ${activeTab === 'search' && isOpen ? 'active' : ''}`}
          onClick={() => handleItemClick('search')}
          title="Search (Ctrl+Shift+F)"
          aria-label="Search"
        >
          <Search size={20} />
        </button>

        {/* 3. Git Source Control */}
        <button
          className={`activitybar-item ${activeTab === 'git' && isOpen ? 'active' : ''}`}
          onClick={() => handleItemClick('git')}
          title="Source Control / Git Commits"
          aria-label="Git History"
        >
          <GitBranch size={20} />
        </button>

        {/* 4. Run & Debug */}
        <button
          className="activitybar-item"
          title="Run & Debug"
          aria-label="Run and Debug"
        >
          <Play size={20} />
        </button>

        {/* 5. Extensions */}
        <button
          className="activitybar-item"
          title="Extensions"
          aria-label="Extensions"
        >
          <LayoutGrid size={20} />
        </button>

        {/* 6. AI Security Assistant (Sparkles) */}
        {onToggleAiAgent && (
          <button
            className={`activitybar-item ${isAiAgentOpen ? 'active' : ''}`}
            onClick={onToggleAiAgent}
            title="Antigravity AI Security Assistant"
            aria-label="AI Security Assistant"
          >
            <Sparkles size={19} />
            {aiVulnCount && aiVulnCount > 0 ? (
              <span className="activitybar-badge">{aiVulnCount}</span>
            ) : null}
          </button>
        )}
      </div>

      {/* Bottom section: Scans history & User profile */}
      <div className="activitybar-bottom">
        <Link
          href="/scans"
          className="activitybar-item"
          title="Scan History (/scans)"
          aria-label="Scan History"
        >
          <History size={19} />
        </Link>
        <Link
          href="/settings"
          className="activitybar-item"
          title="Settings (/settings)"
          aria-label="Settings"
        >
          <Settings size={19} />
        </Link>
      </div>
    </aside>
  );
};
