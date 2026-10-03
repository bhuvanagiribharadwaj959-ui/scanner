'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Loader2,
  ArrowRight,
  PanelLeft,
  PanelBottom,
  PanelRight,
  ShieldAlert,
  Code2,
  Sparkles,
  ChevronDown,
  Clock,
  Sun,
  Bell,
  FolderClosed,
  GitBranch,
  Play,
  LayoutGrid,
} from 'lucide-react';
import { SidebarTab } from '@/types/github';

interface TitleBarProps {
  currentRepoUrl: string;
  onLoadRepo: (url: string) => void;
  onScanRepo: (url: string) => void;
  onRunRagAudit?: () => void;
  isAuditing?: boolean;
  onViewResults?: (scanId: string) => void;
  scanId?: string;
  vulnCount?: number;
  isLoading: boolean;
  isScanning: boolean;
  branch: string;
  activeTab?: SidebarTab;
  onTabChange?: (tab: SidebarTab) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  isScanPanelOpen: boolean;
  onToggleScanPanel: () => void;
}

const GithubIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const TitleBar: React.FC<TitleBarProps> = ({
  currentRepoUrl,
  onLoadRepo,
  onScanRepo,
  onRunRagAudit,
  isAuditing = false,
  onViewResults,
  scanId = 'scan-8f4b1e92-golang-net',
  vulnCount = 14,
  isLoading,
  isScanning,
  activeTab = 'explorer',
  onTabChange,
  isSidebarOpen,
  onToggleSidebar,
  isTerminalOpen,
  onToggleTerminal,
  isScanPanelOpen,
  onToggleScanPanel,
}) => {
  const router = useRouter();
  const [inputUrl, setInputUrl] = useState(currentRepoUrl);

  // Sync with currentRepoUrl changes
  useEffect(() => {
    setInputUrl(currentRepoUrl);
  }, [currentRepoUrl]);

  // Extract friendly repo identifier (e.g. "golang-net")
  const repoName = React.useMemo(() => {
    try {
      const clean = currentRepoUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '');
      const parts = clean.split('/').filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0]}-${parts[1]}`;
      } else if (parts.length === 1) {
        return parts[0];
      }
    } catch {
      // fallback
    }
    return 'golang-net';
  }, [currentRepoUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onLoadRepo(inputUrl.trim());
    }
  };

  const handleScanClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onScanRepo(inputUrl.trim() || currentRepoUrl);
  };

  const handleTabClick = (tab: SidebarTab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    if (!isSidebarOpen) {
      onToggleSidebar();
    }
  };

  return (
    <div className="titlebar-wrapper-group">
      {/* Tier 1: Main macOS Header (Window buttons, project pill, repo search, avatar) */}
      <header className="vscode-titlebar">
        {/* Left: Window Controls & Project Pill */}
        <div className="titlebar-left">
          <div className="window-controls">
            <span className="window-control-dot close" title="Close" />
            <span className="window-control-dot minimize" title="Minimize" />
            <span className="window-control-dot maximize" title="Maximize" />
          </div>

          <div className="titlebar-repo-pill" title={`Active Project: ${repoName}`}>
            <Code2 size={13} className="pill-code-icon" />
            <span className="pill-repo-name">{repoName}</span>
            <ChevronDown size={11} className="pill-chevron" />
          </div>
        </div>

        {/* Center: GitHub Search Input matching Image 2 */}
        <div className="titlebar-center">
          <form onSubmit={handleSubmit} className="titlebar-search-form">
            <div className="repo-search-container">
              <GithubIcon size={16} className="github-brand-icon" />
              <input
                type="text"
                className="repo-search-input"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Search or enter GitHub repo (e.g. https://github.com/golang/net)..."
                disabled={isLoading || isScanning}
              />
              <Search size={14} className="repo-search-glyph" />
            </div>
          </form>
        </div>

        {/* Right: Theme Toggle, Notifications, Profile Avatar */}
        <div className="titlebar-right">
          <button className="titlebar-icon-btn active" title="Theme (Light Mode Active)">
            <Sun size={16} />
          </button>

          <button className="titlebar-icon-btn" title="Notifications">
            <Bell size={16} />
          </button>

          <div className="titlebar-user-avatar" title="Signed in as Developer">
            <span>N</span>
          </div>
        </div>
      </header>

      {/* Tier 2: Sub-toolbar Navigation Row matching Image 2 */}
      <div className="vscode-sub-toolbar">
        {/* Left Tabs: Explorer, Search, Source Control, Run, Extensions */}
        <div className="sub-toolbar-tabs">
          <button
            className={`sub-toolbar-tab ${activeTab === 'explorer' && isSidebarOpen ? 'active' : ''}`}
            onClick={() => handleTabClick('explorer')}
          >
            <FolderClosed size={15} />
            <span>Explorer</span>
          </button>

          <button
            className={`sub-toolbar-tab ${activeTab === 'search' && isSidebarOpen ? 'active' : ''}`}
            onClick={() => handleTabClick('search')}
          >
            <Search size={15} />
            <span>Search</span>
          </button>

          <button
            className={`sub-toolbar-tab ${activeTab === 'git' && isSidebarOpen ? 'active' : ''}`}
            onClick={() => handleTabClick('git')}
          >
            <GitBranch size={15} />
            <span>Source Control</span>
          </button>

          <button
            className="sub-toolbar-tab"
            title="Run & Debug"
          >
            <Play size={15} />
            <span>Run</span>
          </button>

          <button
            className="sub-toolbar-tab"
            title="Extensions"
          >
            <LayoutGrid size={15} />
            <span>Extensions</span>
          </button>
        </div>

        {/* Right Actions: Load, Scan, 14 Vulns, Panel toggles */}
        <div className="sub-toolbar-actions">
          {isLoading ? (
            <div className="sub-load-btn loading">
              <Loader2 size={12} className="animate-spin text-blue-600" />
              <span>Loading...</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="sub-load-btn"
              title="Load Repository"
            >
              <span>Load</span>
              <ArrowRight size={12} />
            </button>
          )}

          {/* iOS Vibrant Blue Scan Button */}
          <button
            type="button"
            onClick={handleScanClick}
            disabled={isScanning || isAuditing || isLoading}
            className={`sub-scan-btn ${isScanning || isAuditing ? 'scanning' : ''}`}
            title="Automatically Scan Codebase & Stream AI Agent AST Analysis"
          >
            {isScanning || isAuditing ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            <span>{isScanning ? 'Scanning...' : isAuditing ? 'Auditing...' : 'Scan'}</span>
          </button>

          {/* Emerald 14 Vulns Badge */}
          <Link
            href="/scans"
            className="sub-vulns-badge"
            title="View Scan Findings and Security Union"
          >
            <ShieldAlert size={13} />
            <span>{vulnCount} Vulns</span>
          </Link>

          {/* History */}
          <Link href="/scans" className="sub-tool-icon-btn" title="Scan History">
            <Clock size={16} />
          </Link>

          {/* Panel toggles */}
          <button
            className={`sub-tool-icon-btn ${isSidebarOpen ? 'active' : ''}`}
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Hide Explorer' : 'Show Explorer'}
          >
            <PanelLeft size={16} />
          </button>

          <button
            className={`sub-tool-icon-btn ${isTerminalOpen ? 'active' : ''}`}
            onClick={onToggleTerminal}
            title={isTerminalOpen ? 'Hide Terminal' : 'Show Terminal'}
          >
            <PanelBottom size={16} />
          </button>

          <button
            className={`sub-tool-icon-btn ${isScanPanelOpen ? 'active' : ''}`}
            onClick={onToggleScanPanel}
            title={isScanPanelOpen ? 'Hide AI Assistant' : 'Show AI Assistant'}
          >
            <PanelRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
