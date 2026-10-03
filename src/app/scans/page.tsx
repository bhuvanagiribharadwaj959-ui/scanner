'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Search,
  ExternalLink,
  Clock,
  ArrowLeft,
  ArrowRight,
  FolderCode,
  Layers,
  Sparkles,
  Bot,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { getAllScans, MultiScannerReport } from '@/utils/scanStore';

export default function ScansHistoryPage() {
  const router = useRouter();
  const [scans, setScans] = useState<MultiScannerReport[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  useEffect(() => {
    setScans(getAllScans());
  }, []);

  const filteredScans = scans.filter((scan) => {
    const matchesSearch =
      scan.target.toLowerCase().includes(searchFilter.toLowerCase()) ||
      scan.scan_id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      scan.branch.toLowerCase().includes(searchFilter.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedSeverity === 'CRITICAL') return scan.summary.severity_distribution.critical > 0;
    if (selectedSeverity === 'HIGH') return scan.summary.severity_distribution.high > 0;
    return true;
  });

  return (
    <div className="history-page-container">
      {/* Top Navigation Bar */}
      <header className="history-header">
        <div className="history-header-left">
          <Link href="/" className="history-back-btn" title="Back to Home">
            <ArrowLeft size={14} />
            <span>Home</span>
          </Link>
          <span className="history-divider">/</span>
          <div className="history-title-block">
            <ShieldAlert size={16} color="#79c0ff" />
            <span className="history-page-title">Scan History</span>
            <span className="history-count-badge">{scans.length}</span>
          </div>
        </div>

        <div className="history-header-right">
          <Link href="/scan/scan-8f4b1e92-golang-net" className="history-primary-action-btn">
            <Sparkles size={13} />
            <span>Open Security Workspace</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="history-main">
        {/* Metric Ribbons */}
        <div className="history-metrics-grid">
          <div className="history-metric-card">
            <div className="history-metric-label">Total Repositories Scanned</div>
            <div className="history-metric-val">{scans.length}</div>
            <div className="history-metric-sub">Multi-ecosystem analysis</div>
          </div>
          <div className="history-metric-card">
            <div className="history-metric-label">Vulnerabilities Detected</div>
            <div className="history-metric-val" style={{ color: '#f85149' }}>
              {scans.reduce((acc, s) => acc + s.summary.total_canonical_vulnerabilities, 0)}
            </div>
            <div className="history-metric-sub">OSV, Trivy & Grype consensus</div>
          </div>
          <div className="history-metric-card">
            <div className="history-metric-label">Gemini AST Triage Rate</div>
            <div className="history-metric-val" style={{ color: '#3fb950' }}>100%</div>
            <div className="history-metric-sub">Zero-token manifest filtering active</div>
          </div>
          <div className="history-metric-card">
            <div className="history-metric-label">RAG ChromaDB Embeddings</div>
            <div className="history-metric-val" style={{ color: '#58a6ff' }}>Active</div>
            <div className="history-metric-sub">AST exploit code signatures</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="history-filter-bar">
          <div className="history-search-box">
            <Search size={14} color="#888888" />
            <input
              type="text"
              placeholder="Filter by repository URL, scan ID, branch..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="history-search-input"
            />
          </div>

          <div className="history-filter-tabs">
            {['ALL', 'CRITICAL', 'HIGH'].map((sev) => (
              <button
                key={sev}
                className={`history-filter-tab ${selectedSeverity === sev ? 'active' : ''}`}
                onClick={() => setSelectedSeverity(sev)}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Scan List */}
        <div className="history-scans-list">
          {filteredScans.map((scan) => {
            const formattedDate = new Date(scan.scanned_at).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div key={scan.scan_id} className="history-scan-card">
                <div className="history-card-top">
                  <div className="history-repo-info">
                    <div className="history-repo-title-row">
                      <FolderCode size={16} color="#79c0ff" />
                      <span className="history-repo-name">{scan.target.replace('https://github.com/', '')}</span>
                      <span className="history-branch-pill">branch: {scan.branch}</span>
                    </div>
                    <div className="history-scan-meta">
                      <span className="history-scan-id">{scan.scan_id}</span>
                      <span>•</span>
                      <span className="history-meta-item">
                        <Clock size={11} />
                        <span>{formattedDate}</span>
                      </span>
                      <span>•</span>
                      <span>Duration: {scan.duration_seconds}s</span>
                    </div>
                  </div>

                  <div className="history-card-actions">
                    <Link
                      href={`/scan/${scan.scan_id}?repo=${encodeURIComponent(scan.target)}`}
                      className="history-open-workspace-btn"
                    >
                      <span>Open in Workspace</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>

                {/* Severity Breakdown Badges */}
                <div className="history-severity-row">
                  <div className="history-sev-pill critical">
                    <span>Critical</span>
                    <strong>{scan.summary.severity_distribution.critical}</strong>
                  </div>
                  <div className="history-sev-pill high">
                    <span>High</span>
                    <strong>{scan.summary.severity_distribution.high}</strong>
                  </div>
                  <div className="history-sev-pill medium">
                    <span>Medium</span>
                    <strong>{scan.summary.severity_distribution.medium}</strong>
                  </div>
                  <div className="history-sev-pill low">
                    <span>Low</span>
                    <strong>{scan.summary.severity_distribution.low}</strong>
                  </div>

                  <div className="history-scanners-pill">
                    <span>Scanners:</span>
                    <span className="history-scanner-tag">OSV</span>
                    <span className="history-scanner-tag">Trivy</span>
                    <span className="history-scanner-tag">Grype</span>
                    <span className="history-scanner-tag ai">Gemini AST RAG</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
