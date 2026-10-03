import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { TreeNode } from '@/types/github';
import { FileIcon } from '@/components/common/FileIcon';

interface FileTreeProps {
  nodes: TreeNode[];
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  expandAllTrigger?: number;
  collapseAllTrigger?: number;
  level?: number;
  vulnerableFilePaths?: Set<string>;
  candidateFindingPaths?: Set<string>;
  findingsMap?: Record<string, 'TP' | 'FP'>;
}

export const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  activeFilePath,
  onSelectFile,
  expandAllTrigger,
  collapseAllTrigger,
  level = 0,
  vulnerableFilePaths = new Set(),
  candidateFindingPaths = new Set(),
  findingsMap = {},
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {nodes.map((node) => (
        <FileTreeNodeItem
          key={node.path}
          node={node}
          activeFilePath={activeFilePath}
          onSelectFile={onSelectFile}
          expandAllTrigger={expandAllTrigger}
          collapseAllTrigger={collapseAllTrigger}
          level={level}
          vulnerableFilePaths={vulnerableFilePaths}
          candidateFindingPaths={candidateFindingPaths}
          findingsMap={findingsMap}
        />
      ))}
    </div>
  );
};

interface FileTreeNodeItemProps {
  node: TreeNode;
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  expandAllTrigger?: number;
  collapseAllTrigger?: number;
  level: number;
  vulnerableFilePaths?: Set<string>;
  candidateFindingPaths?: Set<string>;
  findingsMap?: Record<string, 'TP' | 'FP'>;
}

function folderHasFindingChild(
  node: TreeNode,
  vulnPaths: Set<string>,
  candidatePaths: Set<string>,
  findings: Record<string, 'TP' | 'FP'>
): boolean {
  if (!node.children || node.children.length === 0) return false;
  for (const child of node.children) {
    const clean = child.path.replace(/^\/+/, '');
    if (
      vulnPaths.has(child.path) ||
      vulnPaths.has(clean) ||
      candidatePaths.has(child.path) ||
      candidatePaths.has(clean) ||
      Boolean(findings[child.path] || findings[clean])
    ) {
      return true;
    }
    if (child.type === 'tree' && folderHasFindingChild(child, vulnPaths, candidatePaths, findings)) {
      return true;
    }
  }
  return false;
}

const FileTreeNodeItem: React.FC<FileTreeNodeItemProps> = ({
  node,
  activeFilePath,
  onSelectFile,
  expandAllTrigger,
  collapseAllTrigger,
  level,
  vulnerableFilePaths = new Set(),
  candidateFindingPaths = new Set(),
  findingsMap = {},
}) => {
  const isFolder = node.type === 'tree';
  const hasFindingChild =
    isFolder && folderHasFindingChild(node, vulnerableFilePaths, candidateFindingPaths, findingsMap);
  const [userToggled, setUserToggled] = useState<boolean | null>(null);

  const [prevExpand, setPrevExpand] = useState(expandAllTrigger);
  const [prevCollapse, setPrevCollapse] = useState(collapseAllTrigger);

  if (expandAllTrigger !== prevExpand) {
    setPrevExpand(expandAllTrigger);
    if (expandAllTrigger && expandAllTrigger > 0 && isFolder) {
      setUserToggled(true);
    }
  }

  if (collapseAllTrigger !== prevCollapse) {
    setPrevCollapse(collapseAllTrigger);
    if (collapseAllTrigger && collapseAllTrigger > 0 && isFolder) {
      setUserToggled(false);
    }
  }

  const isOpen = userToggled !== null ? userToggled : level < 1 || hasFindingChild;
  const isActive = activeFilePath === node.path;

  // Check finding type (TP or FP) strictly from model findings
  const cleanPath = node.path.replace(/^\/+/, '');
  const findingType: 'TP' | 'FP' | null =
    findingsMap[node.path] ||
    findingsMap[cleanPath] ||
    null;

  // Check if candidate file flagged by scan
  const isCandidate =
    candidateFindingPaths.has(node.path) ||
    candidateFindingPaths.has(cleanPath) ||
    vulnerableFilePaths.has(node.path) ||
    vulnerableFilePaths.has(cleanPath);

  // Requirement: Make files with red for ALL types of positives (TP or FP) or candidates
  const isRedFinding = !isFolder && (isCandidate || Boolean(findingType));

  const handleClick = () => {
    if (isFolder) {
      setUserToggled(!isOpen);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <div>
      <div
        className={`tree-item-row ${isActive ? 'active' : ''} ${isRedFinding ? 'tree-vuln-row' : ''}`}
        style={{ paddingLeft: `${level * 14 + 10}px` }}
        onClick={handleClick}
        title={
          isRedFinding
            ? `Security Finding (${findingType}) in ${node.path}`
            : node.path
        }
      >
        {isFolder ? (
          <span style={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span style={{ width: 14 }} />
        )}

        <div className="file-icon">
          <FileIcon name={node.name} isFolder={isFolder} isOpen={isOpen} size={15} />
        </div>

        <span
          className={`tree-file-label ${isRedFinding ? 'text-red-vuln' : ''}`}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 12.5,
            flex: 1,
            color: isRedFinding ? '#ef4444' : undefined,
            fontWeight: isRedFinding ? 600 : undefined,
          }}
        >
          {node.name}
        </span>

        {/* Inline Dim TP or FP Tag on the right side */}
        {isRedFinding && findingType && (
          <span
            className={`tree-finding-tag ${findingType.toLowerCase()}`}
            title={
              findingType === 'TP'
                ? 'True Positive: Confirmed Vulnerable Call Site'
                : 'False Positive: Safe Usage Confirmed'
            }
          >
            {findingType}
          </span>
        )}

        {/* Folder has findings child indicator */}
        {hasFindingChild && !isOpen && (
          <span className="tree-folder-vuln-dot" title="Contains files with security findings" />
        )}
      </div>

      {isFolder && isOpen && node.children && (
        <FileTree
          nodes={node.children}
          activeFilePath={activeFilePath}
          onSelectFile={onSelectFile}
          expandAllTrigger={expandAllTrigger}
          collapseAllTrigger={collapseAllTrigger}
          level={level + 1}
          vulnerableFilePaths={vulnerableFilePaths}
          candidateFindingPaths={candidateFindingPaths}
          findingsMap={findingsMap}
        />
      )}
    </div>
  );
};
