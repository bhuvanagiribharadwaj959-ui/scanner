'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Search,
  ArrowRight,
  Sparkles,
  Bot,
  FolderCode,
  Clock,
  History,
  Settings,
  Layers,
  Code2,
  CheckCircle2,
  ExternalLink,
  Flame,
  Zap,
} from 'lucide-react';
import { getAllScans, MultiScannerReport } from '@/utils/scanStore';

export default function HomePage() {
  const router = useRouter();
  const [repoInput, setRepoInput] = useState('https://github.com/golang/net');
  const [scans] = useState<MultiScannerReport[]>(getAllScans());

  const handleLaunchScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;
    const clean = repoInput.trim();
    const scanId = `scan-${Date.now().toString(36)}`;
    router.push(`/scan/${scanId}?repo=${encodeURIComponent(clean)}`);
  };

  const handleQuickLaunch = (repoUrl: string) => {
    const scanId = repoUrl.includes('golang')
      ? 'scan-8f4b1e92-golang-net'
      : repoUrl.includes('express')
      ? 'scan-a91c3d44-express-app'
      : `scan-${Date.now().toString(36)}`;
    router.push(`/scan/${scanId}?repo=${encodeURIComponent(repoUrl)}`);
  };

  const handlePresetLaunch = (preset: 'lodash-vuln' | 'safe-filter' | 'jwt-vuln') => {
    router.push(`/scan/scan-demo-${preset}?preset=${preset}`);
  };

  return (
    <div className="home-container">
      {/* Top TitleBar / Nav */}
      <header className="home-nav">
        <div className="home-nav-left">
          <div className="home-logo">
            <span style={{ fontSize: 16 }}>✨</span>
            <span className="home-logo-text">Antigravity Security</span>
          </div>
          <span className="home-version-tag">v2.5 (1M Context)</span>
        </div>

        <div className="home-nav-right">
          <Link href="/scan/scan-8f4b1e92-golang-net" className="home-nav-link">
            Workspace
          </Link>
          <Link href="/scans" className="home-nav-link">
            <History size={13} />
            <span>Scan History</span>
          </Link>
          <Link href="/settings" className="home-nav-link">
            <Settings size={13} />
            <span>Settings</span>
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="home-main">
        <div className="home-hero">
          <div className="home-badge">
            <Sparkles size={12} color="#79c0ff" />
            <span>Developer Security Workspace • Powered by Gemini Flash 1M Context</span>
          </div>

          <h1 className="home-title">
            Vulnerability Scanner &amp; AI Security Agent
          </h1>

          <p className="home-subtitle">
            Zero-token manifest triage, Google OSV.dev live detection, ChromaDB RAG exploit pattern retrieval,
            and interactive Monaco Editor remediation.
          </p>

          {/* Large Central Repo Search Box */}
          <form onSubmit={handleLaunchScan} className="home-search-card">
            <div className="home-search-inner">
              <Search size={18} color="#888888" style={{ flexShrink: 0 }} />
              <input
                type="text"
                className="home-search-input"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="Enter GitHub repository URL (e.g. https://github.com/golang/net or owner/repo)..."
              />
              <button type="submit" className="home-launch-btn">
                <span>Open Workspace &amp; Scan</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>

          {/* Quick Demo Presets */}
          <div className="home-presets-row">
            <span className="home-presets-label">Quick Presets:</span>
            <button
              className="home-preset-pill"
              onClick={() => handlePresetLaunch('lodash-vuln')}
            >
              <Zap size={12} color="#e3b341" />
              <span>⚡ Lodash CVE-2021-23337 Exploit Demo</span>
            </button>
            <button
              className="home-preset-pill"
              onClick={() => handlePresetLaunch('safe-filter')}
            >
              <CheckCircle2 size={12} color="#3fb950" />
              <span>🛡️ False-Positive Filter Demo</span>
            </button>
            <button
              className="home-preset-pill"
              onClick={() => handlePresetLaunch('jwt-vuln')}
            >
              <Flame size={12} color="#f85149" />
              <span>🔑 JWT Vulnerability Demo</span>
            </button>
            <button
              className="home-preset-pill"
              onClick={() => handleQuickLaunch('https://github.com/SirAppSec/vuln-node.js-express.js-app')}
            >
              <span>📦 SirAppSec/vuln-node.js-express.js-app (138 CVEs)</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="home-metrics-grid">
          <div className="home-metric-box">
            <div className="home-metric-val">1M+</div>
            <div className="home-metric-title">Token Context Window</div>
            <div className="home-metric-desc">Whole-repo code AST reasoning</div>
          </div>
          <div className="home-metric-box">
            <div className="home-metric-val">0 Tokens</div>
            <div className="home-metric-title">Manifest Pre-Filter</div>
            <div className="home-metric-desc">package.json/go.mod instant triage</div>
          </div>
          <div className="home-metric-box">
            <div className="home-metric-val">ChromaDB</div>
            <div className="home-metric-title">RAG Vector Retrieval</div>
            <div className="home-metric-desc">Grounds Gemini on exact exploit ASTs</div>
          </div>
          <div className="home-metric-box">
            <div className="home-metric-val">Cursor / Antigravity</div>
            <div className="home-metric-title">AI Agent Interface</div>
            <div className="home-metric-desc">Live AST reasoning &amp; safe code patches</div>
          </div>
        </div>

        {/* Recent Scans & Projects */}
        <section className="home-recent-section">
          <div className="home-section-header">
            <div className="home-section-title-row">
              <FolderCode size={18} color="#79c0ff" />
              <h2 className="home-section-title">Recent Scans &amp; Repositories</h2>
            </div>
            <Link href="/scans" className="home-view-all-link">
              <span>View All Scans</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="home-recent-grid">
            {scans.map((scan) => {
              const formattedDate = new Date(scan.scanned_at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div key={scan.scan_id} className="home-scan-card">
                  <div className="home-card-header">
                    <div>
                      <div className="home-card-repo">{scan.target.replace('https://github.com/', '')}</div>
                      <div className="home-card-meta">
                        <span>{scan.branch}</span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                        <span>•</span>
                        <span>{scan.duration_seconds}s</span>
                      </div>
                    </div>

                    <Link
                      href={`/scan/${scan.scan_id}?repo=${encodeURIComponent(scan.target)}`}
                      className="home-card-open-btn"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight size={11} />
                    </Link>
                  </div>

                  {/* Severity Tags */}
                  <div className="home-card-severities">
                    <span className="home-sev-badge critical">
                      Critical: {scan.summary.severity_distribution.critical}
                    </span>
                    <span className="home-sev-badge high">
                      High: {scan.summary.severity_distribution.high}
                    </span>
                    <span className="home-sev-badge medium">
                      Medium: {scan.summary.severity_distribution.medium}
                    </span>
                    <span className="home-sev-badge low">
                      Low: {scan.summary.severity_distribution.low}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
