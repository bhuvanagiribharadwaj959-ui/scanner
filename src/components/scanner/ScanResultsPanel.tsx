import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  X,
  Search,
  Download,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  FileCode,
  Layers,
  ChevronDown,
  ChevronRight,
  Database,
  History,
} from 'lucide-react';
import { ScanResult, VulnerabilitySeverity } from '@/types/scanner';

interface ScanResultsPanelProps {
  results: ScanResult | null;
  isLoading: boolean;
  onClose: () => void;
  onRescan: () => void;
  repoUrl: string;
  scanHistory: ScanResult[];
  onSelectHistoryItem?: (result: ScanResult) => void;
}

export const ScanResultsPanel: React.FC<ScanResultsPanelProps> = ({
  results,
  isLoading,
  onClose,
  onRescan,
  repoUrl,
  scanHistory,
  onSelectHistoryItem,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | VulnerabilitySeverity>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedVulnKeys, setExpandedVulnKeys] = useState<Set<string>>(new Set());
  const [isCopied, setIsCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Resizable panel width (drag on left edge)
  const [panelWidth, setPanelWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLElement>(null);

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
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth >= 320 && newWidth <= 800) {
          setPanelWidth(newWidth);
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

  const toggleExpand = (key: string) => {
    setExpandedVulnKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleCopyUnionJson = () => {
    if (!results) return;
    const jsonStr = JSON.stringify(results.vulnerabilities, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadUnionJson = () => {
    if (!results) return;
    const jsonStr = JSON.stringify(results.vulnerabilities, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeRepo = (results.repo || 'project').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `union-scan-${safeRepo}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter vulnerabilities
  const filteredVulnerabilities = useMemo(() => {
    if (!results) return [];
    return results.vulnerabilities.filter((vuln) => {
      // Severity filter
      if (severityFilter !== 'ALL' && vuln.severity !== severityFilter) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesPkg = vuln.package.toLowerCase().includes(query);
        const matchesCve = vuln.cve_id.toLowerCase().includes(query);
        const matchesSummary = (vuln.summary || vuln.title || '').toLowerCase().includes(query);
        const matchesAliases = vuln.aliases?.some((a) => a.toLowerCase().includes(query));
        return matchesPkg || matchesCve || matchesSummary || matchesAliases;
      }
      return true;
    });
  }, [results, severityFilter, searchQuery]);

  const getSeverityBadgeClass = (severity: VulnerabilitySeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'vuln-badge-critical';
      case 'HIGH':
        return 'vuln-badge-high';
      case 'MEDIUM':
        return 'vuln-badge-medium';
      case 'LOW':
        return 'vuln-badge-low';
      default:
        return 'vuln-badge-unknown';
    }
  };

  const router = useRouter();

  return (
    <aside
      ref={panelRef}
      className="vscode-scan-panel"
      style={{
        width: panelWidth,
        position: 'relative',
        userSelect: isResizing ? 'none' : undefined,
      }}
    >
      {/* Left border drag handle */}
      <div
        className="scan-panel-resize-handle"
        onMouseDown={startResizing}
        onDoubleClick={() => setPanelWidth((prev) => (prev > 450 ? 420 : 600))}
        title="Drag to resize Scan Results or double-click to toggle width"
      />

      {/* 1. Header */}
      <div className="scan-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
          <ShieldAlert size={16} color="#e5534b" />
          <span className="scan-panel-title">SCAN RESULTS</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => router.push(`/scan/${results?.id || 'scan-8f4b1e92-golang-net'}`)}
            className="scan-header-icon-btn"
            title={`Open Full Report at /scan/${results?.id || 'scan-8f4b1e92-golang-net'}`}
            style={{ color: '#58a6ff' }}
          >
            <ExternalLink size={13} />
          </button>

          {scanHistory.length > 1 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`scan-header-icon-btn ${showHistory ? 'active' : ''}`}
              title="View Scan History"
            >
              <History size={14} />
            </button>
          )}

          <button
            onClick={onRescan}
            disabled={isLoading}
            className="scan-header-icon-btn"
            title="Re-run OSV Scan"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button onClick={onClose} className="scan-header-icon-btn" title="Close Scan Results Panel">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* History Dropdown Drawer */}
      {showHistory && scanHistory.length > 1 && (
        <div className="scan-history-drawer">
          <div style={{ fontSize: 11, fontWeight: 600, color: '#bbbbbb', marginBottom: 6 }}>
            Scan History ({scanHistory.length})
          </div>
          <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {scanHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoryItem?.(item);
                  setShowHistory(false);
                }}
                className={`scan-history-item ${item.id === results?.id ? 'active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500, color: '#ffffff' }}>
                    {item.owner}/{item.repo}
                  </span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{item.formattedTime}</span>
                </div>
                <div style={{ fontSize: 10.5, color: '#999999', marginTop: 2 }}>
                  {item.stats.total} vulnerabilities ({item.stats.critical} crit, {item.stats.high} high)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Repository Info & Timestamp Banner */}
      <div className="scan-repo-banner">
        <div className="scan-repo-url-row">
          <span style={{ color: '#888888', fontSize: 11 }}>Target Repository:</span>
          {results?.repoUrl && results.repoUrl.startsWith('http') ? (
            <a
              href={results.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="scan-repo-link"
              title="Open repository on GitHub"
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{results.repoUrl}</span>
              <ExternalLink size={11} style={{ flexShrink: 0 }} />
            </a>
          ) : (
            <span style={{ color: '#58a6ff', fontWeight: 500, fontSize: 11.5 }}>
              {results?.repoUrl || repoUrl}
            </span>
          )}
        </div>

        <div className="scan-timestamp-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={12} color="#79c0ff" />
            <span style={{ color: '#c9d1d9', fontWeight: 500 }}>
              {results?.formattedTime || 'Not scanned yet'}
            </span>
          </div>

          {results?.durationMs !== undefined && (
            <span style={{ color: '#8b949e', fontSize: 10.5 }}>
              Completed in {(results.durationMs / 1000).toFixed(2)}s
            </span>
          )}
        </div>

        {/* Database Attribution Badge */}
        <div className="scan-db-attribution">
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Database size={11} color="#3fb950" />
            <span>Google OSV.dev &bull; Unified Vulnerability Database</span>
          </div>
          <div className="scan-union-pill" title="Deduplicated into Single Union Schema">
            <Layers size={10} />
            <span>Union Deduplicated</span>
          </div>
        </div>

        {/* Action button to open full /scan/{scanId} route */}
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => router.push(`/scan/${results?.id || 'scan-8f4b1e92-golang-net'}`)}
            className="scan-action-btn primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 10px', fontSize: 11.5 }}
          >
            <FileCode size={13} />
            <span>Open in /scan/{results?.id || 'scan-8f4b1e92-golang-net'}</span>
            <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {/* 3. Severity Stat Cards */}
      {results && (
        <div className="scan-stats-grid">
          <div
            className={`stat-box total ${severityFilter === 'ALL' ? 'selected' : ''}`}
            onClick={() => setSeverityFilter('ALL')}
            title="Show all vulnerabilities"
          >
            <span className="stat-number">{results.stats.total}</span>
            <span className="stat-label">Total</span>
          </div>

          <div
            className={`stat-box critical ${severityFilter === 'CRITICAL' ? 'selected' : ''}`}
            onClick={() => setSeverityFilter('CRITICAL')}
            title="Filter by Critical"
          >
            <span className="stat-number">{results.stats.critical}</span>
            <span className="stat-label">Critical</span>
          </div>

          <div
            className={`stat-box high ${severityFilter === 'HIGH' ? 'selected' : ''}`}
            onClick={() => setSeverityFilter('HIGH')}
            title="Filter by High"
          >
            <span className="stat-number">{results.stats.high}</span>
            <span className="stat-label">High</span>
          </div>

          <div
            className={`stat-box medium ${severityFilter === 'MEDIUM' ? 'selected' : ''}`}
            onClick={() => setSeverityFilter('MEDIUM')}
            title="Filter by Medium"
          >
            <span className="stat-number">{results.stats.medium}</span>
            <span className="stat-label">Medium</span>
          </div>

          <div
            className={`stat-box low ${severityFilter === 'LOW' ? 'selected' : ''}`}
            onClick={() => setSeverityFilter('LOW')}
            title="Filter by Low"
          >
            <span className="stat-number">{results.stats.low}</span>
            <span className="stat-label">Low</span>
          </div>
        </div>
      )}

      {/* 4. Search and Filter Bar */}
      {results && results.vulnerabilities.length > 0 && (
        <div className="scan-filter-bar">
          <div className="scan-search-input-box">
            <Search size={13} color="#8b949e" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search package, CVE, advisory..."
              className="scan-search-input"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="scan-clear-btn">
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. Vulnerability List */}
      <div className="scan-results-content">
        {isLoading ? (
          <div className="scan-loading-state">
            <RefreshCw size={24} className="animate-spin" color="#58a6ff" />
            <div style={{ marginTop: 12, fontWeight: 500, color: '#ffffff' }}>
              Scanning dependencies...
            </div>
            <div style={{ fontSize: 11.5, color: '#8b949e', marginTop: 4, textAlign: 'center', maxWidth: 260 }}>
              Querying Google OSV.dev database and resolving dependency manifests for {repoUrl}
            </div>
          </div>
        ) : !results ? (
          <div className="scan-empty-state">
            <ShieldCheck size={32} color="#8b949e" style={{ opacity: 0.5 }} />
            <div style={{ marginTop: 12, fontWeight: 500, color: '#c9d1d9' }}>
              No scan results yet
            </div>
            <div style={{ fontSize: 11.5, color: '#8b949e', marginTop: 4, textAlign: 'center', maxWidth: 260 }}>
              Click the <strong>Scan</strong> button in the top bar to inspect dependencies for vulnerabilities.
            </div>
            <button onClick={onRescan} className="scan-action-btn primary" style={{ marginTop: 16 }}>
              <ShieldAlert size={14} />
              <span>Run OSV Scan Now</span>
            </button>
          </div>
        ) : results.vulnerabilities.length === 0 ? (
          <div className="scan-empty-state">
            <ShieldCheck size={36} color="#3fb950" />
            <div style={{ marginTop: 12, fontWeight: 600, color: '#3fb950', fontSize: 14 }}>
              Zero Vulnerabilities Found!
            </div>
            <div style={{ fontSize: 12, color: '#8b949e', marginTop: 6, textAlign: 'center', maxWidth: 280 }}>
              Google OSV database reports clean dependency manifests for{' '}
              <strong style={{ color: '#c9d1d9' }}>{results.owner}/{results.repo}</strong>.
            </div>
          </div>
        ) : filteredVulnerabilities.length === 0 ? (
          <div className="scan-empty-state">
            <AlertTriangle size={28} color="#d29922" />
            <div style={{ marginTop: 10, color: '#c9d1d9', fontWeight: 500 }}>
              No matching vulnerabilities
            </div>
            <div style={{ fontSize: 11.5, color: '#8b949e', marginTop: 4 }}>
              Try adjusting your filter or search query.
            </div>
            <button
              onClick={() => {
                setSeverityFilter('ALL');
                setSearchQuery('');
              }}
              className="scan-action-btn secondary"
              style={{ marginTop: 12 }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="scan-cards-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px' }}>
              <span style={{ fontSize: 11, color: '#8b949e' }}>
                Showing <strong>{filteredVulnerabilities.length}</strong> of{' '}
                <strong>{results.vulnerabilities.length}</strong> findings
              </span>
            </div>

            {filteredVulnerabilities.map((vuln, idx) => {
              const cardKey = `${vuln.package}-${vuln.cve_id}-${idx}`;
              const isExpanded = expandedVulnKeys.has(cardKey);

              return (
                <div key={cardKey} className={`vuln-card border-${vuln.severity.toLowerCase()}`}>
                  {/* Card Header */}
                  <div className="vuln-card-header" onClick={() => toggleExpand(cardKey)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, overflow: 'hidden' }}>
                      <span className="vuln-expand-icon">
                        {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                      </span>
                      <FileCode size={13} color="#79c0ff" style={{ flexShrink: 0 }} />
                      <span className="vuln-package-name" title={vuln.package}>
                        {vuln.package}
                      </span>
                      <span className="vuln-version-badge" title="Installed Version">
                        v{vuln.installed_version}
                      </span>
                    </div>

                    <span className={`vuln-severity-tag ${getSeverityBadgeClass(vuln.severity)}`}>
                      {vuln.severity}
                    </span>
                  </div>

                  {/* Card Sub-row */}
                  <div className="vuln-card-subrow">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {vuln.file_path && (
                        <span
                          className="vuln-source-tag"
                          style={{ color: '#79c0ff', background: 'rgba(56, 139, 253, 0.12)', borderColor: 'rgba(56, 139, 253, 0.3)' }}
                          title={`Detected in source file: ${vuln.file_path}`}
                        >
                          📁 {vuln.file_path}
                        </span>
                      )}

                      {vuln.advisory_url ? (
                        <a
                          href={vuln.advisory_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="vuln-cve-link"
                          title="Open Advisory"
                        >
                          <span>{vuln.cve_id}</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="vuln-cve-id">{vuln.cve_id}</span>
                      )}

                      {/* Source badges */}
                      {vuln.detected_by.map((src) => (
                        <span key={src} className="vuln-source-tag">
                          {src}
                        </span>
                      ))}

                      {vuln.fixed_version && (
                        <span className="vuln-fixed-tag" title="Remediation Version">
                          Fixed: v{vuln.fixed_version}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title / Summary */}
                  {vuln.title && (
                    <div className="vuln-card-title" onClick={() => toggleExpand(cardKey)}>
                      {vuln.title}
                    </div>
                  )}

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="vuln-card-details">
                      {vuln.details && (
                        <div className="vuln-details-text">
                          {vuln.details}
                        </div>
                      )}

                      {vuln.aliases && vuln.aliases.length > 0 && (
                        <div className="vuln-aliases-row">
                          <span style={{ color: '#8b949e', fontSize: 10.5 }}>Aliases:</span>
                          {vuln.aliases.map((alias) => (
                            <span key={alias} className="vuln-alias-badge">
                              {alias}
                            </span>
                          ))}
                        </div>
                      )}

                      {vuln.published_at && (
                        <div style={{ fontSize: 10.5, color: '#8b949e', marginTop: 6 }}>
                          Published: {new Date(vuln.published_at).toLocaleDateString()}
                        </div>
                      )}

                      {vuln.advisory_url && (
                        <div style={{ marginTop: 8 }}>
                          <a
                            href={vuln.advisory_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="vuln-external-advisory-btn"
                          >
                            <span>Read full advisory on OSV / GHSA</span>
                            <ExternalLink size={11} />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Footer Actions: Download, Copy & Route Link */}
      {results && results.vulnerabilities.length > 0 && (
        <div className="scan-panel-footer">
          <button
            onClick={() => router.push(`/scan/${results?.id || 'scan-8f4b1e92-golang-net'}`)}
            className="scan-footer-btn"
            style={{ background: '#1f6feb' }}
            title="Inspect in Full Audit Route (/scan/{scanID})"
          >
            <ExternalLink size={13} />
            <span>Full Route</span>
          </button>

          <button
            onClick={handleDownloadUnionJson}
            className="scan-footer-btn"
            title="Download Unified JSON output (Trivy/Grype/OSV Union format)"
          >
            <Download size={13} />
            <span>Download</span>
          </button>

          <button
            onClick={handleCopyUnionJson}
            className="scan-footer-btn secondary"
            title="Copy Union JSON to clipboard"
          >
            {isCopied ? <Check size={13} color="#3fb950" /> : <Copy size={13} />}
            <span>{isCopied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      )}
    </aside>
  );
};
