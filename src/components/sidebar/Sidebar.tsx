import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  RefreshCw,
  X,
  FolderTree,
  ChevronsDown,
  ChevronsUp,
  PanelLeftClose,
} from 'lucide-react';
import { TreeNode, OpenFile, SidebarTab } from '@/types/github';
import { FileTree } from './FileTree';
import { SearchView } from './SearchView';
import { GitHistoryView } from './GitHistoryView';
import { FileIcon } from '@/components/common/FileIcon';

interface SidebarProps {
  activeTab: SidebarTab;
  owner: string;
  repo: string;
  branch: string;
  treeNodes: TreeNode[];
  flatFiles: Array<{ path: string; type: string; size?: number }>;
  activeFilePath: string | null;
  openFiles: OpenFile[];
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  onRefreshRepo: () => void;
  onCloseSidebar?: () => void;
  isLoading: boolean;
  vulnerableFilePaths?: Set<string>;
  candidateFindingPaths?: Set<string>;
  findingsMap?: Record<string, 'TP' | 'FP'>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  owner,
  repo,
  branch,
  treeNodes,
  flatFiles,
  activeFilePath,
  openFiles,
  onSelectFile,
  onCloseFile,
  onRefreshRepo,
  onCloseSidebar,
  isLoading,
  vulnerableFilePaths = new Set(),
  candidateFindingPaths = new Set(),
  findingsMap = {},
}) => {
  const [isOpenEditorsOpen, setIsOpenEditorsOpen] = useState(true);
  const [isRepoTreeOpen, setIsRepoTreeOpen] = useState(true);

  // Expand / Collapse all triggers for file tree
  const [expandAllTrigger, setExpandAllTrigger] = useState(0);
  const [collapseAllTrigger, setCollapseAllTrigger] = useState(0);

  // Resizable sidebar width
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        // ActivityBar is 48px wide
        const newWidth = e.clientX - 48;
        if (newWidth >= 170 && newWidth <= 750) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const handleDoubleClickResize = () => {
    // Toggle between default width and wide width
    setSidebarWidth((prev) => (prev > 300 ? 260 : 450));
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'explorer':
        return `EXPLORER${repo ? `: ${repo.toUpperCase()}` : ''}`;
      case 'search':
        return 'SEARCH';
      case 'git':
        return 'GIT COMMITS';
      default:
        return 'SIDEBAR';
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className="vscode-sidebar"
      style={{
        width: sidebarWidth,
        position: 'relative',
        userSelect: isResizing ? 'none' : undefined,
      }}
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getTitle()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {activeTab === 'explorer' && repo && (
            <>
              {/* Expand All Folders in Explorer */}
              <button
                onClick={() => setExpandAllTrigger((prev) => prev + 1)}
                title="Expand All Folders in Explorer"
                style={{ opacity: 0.7, padding: 2 }}
              >
                <ChevronsDown size={14} />
              </button>

              {/* Collapse All Folders in Explorer */}
              <button
                onClick={() => setCollapseAllTrigger((prev) => prev + 1)}
                title="Collapse All Folders in Explorer"
                style={{ opacity: 0.7, padding: 2 }}
              >
                <ChevronsUp size={14} />
              </button>

              {/* Refresh Repository Tree */}
              <button
                onClick={onRefreshRepo}
                title="Refresh Repository Tree"
                style={{ opacity: 0.7, padding: 2 }}
                disabled={isLoading}
              >
                <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </>
          )}

          {/* De-expand / Collapse Sidebar Button */}
          {onCloseSidebar && (
            <button
              onClick={onCloseSidebar}
              title="Collapse Side Bar (Ctrl+B)"
              style={{ opacity: 0.7, padding: 2, marginLeft: 2 }}
            >
              <PanelLeftClose size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-content">
        {/* TAB 1: EXPLORER */}
        {activeTab === 'explorer' && (
          <div>
            {/* OPEN EDITORS Section */}
            {openFiles.length > 0 && (
              <div style={{ borderBottom: '1px solid #f1f5f9' }}>
                <div
                  className="file-tree-section-header"
                  onClick={() => setIsOpenEditorsOpen(!isOpenEditorsOpen)}
                >
                  {isOpenEditorsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  <span>OPEN EDITORS</span>
                  <span className="file-tree-count-badge" style={{ marginLeft: 'auto' }}>
                    {openFiles.length}
                  </span>
                </div>

                {isOpenEditorsOpen && (
                  <div style={{ padding: '2px 0' }}>
                    {openFiles.map((file) => {
                      const isActive = activeFilePath === file.path;
                      return (
                        <div
                          key={file.path}
                          className={`tree-item-row ${isActive ? 'active' : ''}`}
                          style={{ paddingLeft: 18, justifyContent: 'space-between' }}
                          onClick={() => onSelectFile(file.path)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                            <FileIcon name={file.name} size={14} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {file.name}
                            </span>
                          </div>
                          <button
                            className="tab-close-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCloseFile(file.path);
                            }}
                            title="Close"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* REPOSITORY FILE TREE */}
            <div>
              <div
                className="file-tree-section-header"
                onClick={() => setIsRepoTreeOpen(!isRepoTreeOpen)}
              >
                {isRepoTreeOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                  {owner && repo ? `${owner}-${repo}` : 'NO REPOSITORY LOADED'}
                </span>
                <span className="file-tree-count-badge" style={{ marginLeft: 'auto' }}>
                  {flatFiles.filter((f) => f.type === 'blob').length || 840}
                </span>
              </div>

              {isRepoTreeOpen && (
                <div style={{ padding: '4px 0' }}>
                  {treeNodes.length > 0 ? (
                    <FileTree
                      nodes={treeNodes}
                      activeFilePath={activeFilePath}
                      onSelectFile={onSelectFile}
                      expandAllTrigger={expandAllTrigger}
                      collapseAllTrigger={collapseAllTrigger}
                      level={0}
                      vulnerableFilePaths={vulnerableFilePaths}
                      candidateFindingPaths={candidateFindingPaths}
                      findingsMap={findingsMap}
                    />
                  ) : (
                    <div style={{ padding: '20px 16px', color: '#888888', fontSize: 12, textAlign: 'center' }}>
                      {isLoading ? (
                        <span>Loading file tree...</span>
                      ) : (
                        <span>
                          No repository loaded. Enter a GitHub repository link in the top bar to inspect its tree.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SEARCH */}
        {activeTab === 'search' && (
          <SearchView
            flatFiles={flatFiles}
            onSelectFile={onSelectFile}
            activeFilePath={activeFilePath}
          />
        )}

        {/* TAB 3: GIT HISTORY */}
        {activeTab === 'git' && (
          <GitHistoryView owner={owner} repo={repo} branch={branch} />
        )}
      </div>

      {/* Resize Handle on Right Border */}
      <div
        className="sidebar-resize-handle"
        onMouseDown={startResizing}
        onDoubleClick={handleDoubleClickResize}
        title="Drag to resize Explorer or double click to toggle width"
      />
    </aside>
  );
};
