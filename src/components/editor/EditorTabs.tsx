import React from 'react';
import { X, ChevronRight, Folder, Download } from 'lucide-react';
import { OpenFile } from '@/types/github';
import { FileIcon } from '@/components/common/FileIcon';

interface EditorTabsProps {
  openFiles: OpenFile[];
  activeFilePath: string | null;
  onSelectFile: (path: string) => void;
  onCloseFile: (path: string) => void;
  owner: string;
  repo: string;
}

const SCAN_REPORT_FILES = new Set([
  'osv-scanner.json',
  'trivy-report.json',
  'grype-report.json',
  'vulnerabilities-union.json',
]);

export const EditorTabs: React.FC<EditorTabsProps> = ({
  openFiles,
  activeFilePath,
  onSelectFile,
  onCloseFile,
  owner,
  repo,
}) => {
  if (openFiles.length === 0) return null;

  const activeFile = openFiles.find((f) => f.path === activeFilePath);
  const breadcrumbParts = activeFile ? activeFile.path.split('/') : [];

  const isScanReport = Boolean(
    activeFile &&
      (SCAN_REPORT_FILES.has(activeFile.name) ||
        activeFile.path.startsWith('scan-results/') ||
        activeFile.path.startsWith('.scanner-results/'))
  );

  const handleDownload = () => {
    if (!activeFile?.content) return;
    const blob = new Blob([activeFile.content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name.endsWith('.json') ? activeFile.name : `${activeFile.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Tabs Header */}
      <div className="editor-tabs-bar">
        {openFiles.map((file) => {
          const isActive = file.path === activeFilePath;
          return (
            <div
              key={file.path}
              className={`editor-tab ${isActive ? 'active' : ''}`}
              onClick={() => onSelectFile(file.path)}
              title={file.path}
            >
              <FileIcon name={file.name} size={14} />
              <span>{file.name}</span>
              <button
                className="tab-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseFile(file.path);
                }}
                title="Close Tab"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Breadcrumbs Row */}
      {activeFile && (
        <div className="editor-breadcrumbs" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            {owner && repo && (
              <div className="breadcrumb-segment">
                <Folder size={12} color="#e5ba48" />
                <span>{repo}</span>
                <ChevronRight size={12} color="#666666" />
              </div>
            )}

            {breadcrumbParts.map((part, index) => {
              const isLast = index === breadcrumbParts.length - 1;
              return (
                <div
                  key={index}
                  className={`breadcrumb-segment ${isLast ? 'current' : ''}`}
                >
                  {isLast && <FileIcon name={part} size={12} />}
                  <span>{part}</span>
                  {!isLast && <ChevronRight size={12} color="#666666" />}
                </div>
              );
            })}
          </div>

          {/* Show Download Button STRICTLY for the 4 scan result JSON files */}
          {isScanReport && (
            <button
              className="download-report-btn"
              onClick={handleDownload}
              title={`Download RAW ${activeFile.name} report`}
            >
              <Download size={12} />
              <span>Download JSON</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
