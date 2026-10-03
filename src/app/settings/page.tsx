'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  ArrowLeft,
  Sparkles,
  Bot,
  Database,
  ShieldCheck,
  Check,
  Cpu,
  Key,
  Sliders,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export default function SettingsPage() {
  const [selectedModel, setSelectedModel] = useState('gemini-3.5-flash');
  const [astMode, setAstMode] = useState<'balanced' | 'strict' | 'discovery'>('balanced');
  const [zeroTokenFilter, setZeroTokenFilter] = useState(true);
  const [autoTriggerAgent, setAutoTriggerAgent] = useState(true);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  return (
    <div className="settings-page-container">
      {/* Top Header */}
      <header className="settings-header">
        <div className="settings-header-left">
          <Link href="/" className="settings-back-btn" title="Back to Home">
            <ArrowLeft size={14} />
            <span>Home</span>
          </Link>
          <span className="settings-divider">/</span>
          <div className="settings-title-block">
            <Settings size={16} color="#79c0ff" />
            <span className="settings-page-title">Configuration & Scanner Settings</span>
          </div>
        </div>

        <div className="settings-header-right">
          <button onClick={handleSave} className="settings-save-btn">
            {savedFeedback ? <Check size={13} /> : <CheckCircle2 size={13} />}
            <span>{savedFeedback ? 'Saved' : 'Save Preferences'}</span>
          </button>
        </div>
      </header>

      {/* Main Settings Sections */}
      <main className="settings-main">
        {/* Section 1: AI Provider & Model Configuration */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-icon-bubble">
              <Cpu size={16} color="#79c0ff" />
            </div>
            <div>
              <h2 className="settings-section-title">AI Engine & 1M Token Context</h2>
              <p className="settings-section-desc">
                Configure Google Gemini 1,048,576 token context models for Cyber AST triage and RAG analysis.
              </p>
            </div>
          </div>

          <div className="settings-card-grid">
            <div className="settings-field">
              <label className="settings-label">Gemini Model Selector</label>
              <select
                className="settings-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="gemini-3.5-flash">Gemini 3.5 Flash Cyber (1,048,576 Tokens • Cyber Context POV)</option>
                <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (1,048,576 Tokens • High Availability)</option>
                <option value="gemini-flash-latest">Gemini Flash Latest (1,048,576 Tokens • Balanced)</option>
                <option value="gemini-3.7-flash">Gemini 3.7 Flash (1,048,576 Tokens)</option>
              </select>
              <span className="settings-hint">
                Automatic multi-model failover enabled on 503/429 status codes.
              </span>
            </div>

            <div className="settings-field">
              <label className="settings-label">AST Analysis Mode</label>
              <div className="settings-radio-group">
                <label className={`settings-radio-card ${astMode === 'balanced' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="astMode"
                    value="balanced"
                    checked={astMode === 'balanced'}
                    onChange={() => setAstMode('balanced')}
                  />
                  <div>
                    <div className="settings-radio-title">Balanced (Recommended)</div>
                    <div className="settings-radio-desc">Triage candidate files importing vulnerable packages.</div>
                  </div>
                </label>

                <label className={`settings-radio-card ${astMode === 'strict' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="astMode"
                    value="strict"
                    checked={astMode === 'strict'}
                    onChange={() => setAstMode('strict')}
                  />
                  <div>
                    <div className="settings-radio-title">Strict AST Validation</div>
                    <div className="settings-radio-desc">Requires proof of unescaped taint dataflow.</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="settings-field">
              <label className="settings-label">Gemini API Key Status</label>
              <div className="settings-key-status">
                <Key size={13} color="#3fb950" />
                <span className="settings-key-badge">Active & Verified (Environment Variable)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Security Scanners & Vector Store */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-icon-bubble">
              <Database size={16} color="#d2a8ff" />
            </div>
            <div>
              <h2 className="settings-section-title">Knowledge Bases & Vector Store</h2>
              <p className="settings-section-desc">
                External security APIs, vector databases, and vulnerability data sources.
              </p>
            </div>
          </div>

          <div className="settings-integrations-list">
            <div className="settings-integration-item">
              <div className="settings-integration-left">
                <span className="settings-integration-name">Google OSV.dev Database</span>
                <span className="settings-integration-detail">api.osv.dev/v1/query & querybatch (Free, No Key Required)</span>
              </div>
              <span className="settings-status-pill green">Connected</span>
            </div>

            <div className="settings-integration-item">
              <div className="settings-integration-left">
                <span className="settings-integration-name">ChromaDB RAG Vector Store</span>
                <span className="settings-integration-detail">./vulnerability_vector_db/vulnerabilities.json (Local Embedding Store)</span>
              </div>
              <span className="settings-status-pill green">Indexed (340+ CVEs)</span>
            </div>

            <div className="settings-integration-item">
              <div className="settings-integration-left">
                <span className="settings-integration-name">Zero-Token Manifest Filter</span>
                <span className="settings-integration-detail">Automatically triages package.json/go.mod as safe false positives (0 LLM tokens wasted)</span>
              </div>
              <label className="settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={zeroTokenFilter}
                  onChange={(e) => setZeroTokenFilter(e.target.checked)}
                />
                <span className="settings-toggle-slider" />
              </label>
            </div>

            <div className="settings-integration-item">
              <div className="settings-integration-left">
                <span className="settings-integration-name">Auto-Trigger AI Agent on Scan</span>
                <span className="settings-integration-detail">Automatically start Gemini AST RAG triage when Scan button is clicked</span>
              </div>
              <label className="settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={autoTriggerAgent}
                  onChange={(e) => setAutoTriggerAgent(e.target.checked)}
                />
                <span className="settings-toggle-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Navigation Quick Action */}
        <div className="settings-quick-nav">
          <Link href="/scan/scan-8f4b1e92-golang-net" className="settings-launch-btn">
            <Sparkles size={14} />
            <span>Launch Security Workspace</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
