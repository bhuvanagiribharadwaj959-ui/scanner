'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  Folder,
  FileCode,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Bot,
  Terminal,
  ArrowDown,
  Mic,
  Send,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Code2,
  HardDrive,
  MoreHorizontal,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { AiFileAnalysis, RagAuditResult } from '@/types/scanner';

interface AiAgentScannerProps {
  auditResult: RagAuditResult | null;
  isAuditing: boolean;
  onRunAudit: () => void;
  onSelectFinding: (finding: AiFileAnalysis) => void;
  currentScanningFile?: string;
  onLoadPreset?: (type: 'lodash-vuln' | 'safe-filter' | 'jwt-vuln') => void;
  activeFilePath?: string | null;
}

export const AiAgentScanner: React.FC<AiAgentScannerProps> = ({
  auditResult,
  isAuditing,
  onRunAudit,
  onSelectFinding,
  currentScanningFile,
  onLoadPreset,
  activeFilePath,
}) => {
  const [promptText, setPromptText] = useState('');
  const [inputText, setInputText] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showSteps, setShowSteps] = useState<boolean>(true);
  const [showSafeFiles, setShowSafeFiles] = useState<boolean>(false);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [showAttachedChip, setShowAttachedChip] = useState<boolean>(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Time display in 12-hour format
  const [currentTime, setCurrentTime] = useState('12:35 PM');
  useEffect(() => {
    const now = new Date();
    setCurrentTime(
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  }, [auditResult]);

  // Step ticker during active auditing
  useEffect(() => {
    if (!isAuditing) {
      setActiveStepIdx(0);
      return;
    }

    const timer = setInterval(() => {
      setActiveStepIdx((prev) => (prev < 4 ? prev + 1 : prev));
    }, 1600);

    return () => clearInterval(timer);
  }, [isAuditing]);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleSendPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      setPromptText(inputText.trim());
      setInputText('');
    }
    onRunAudit();
  };

  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const activeFileName = activeFilePath
    ? activeFilePath.split('/').pop() || activeFilePath
    : 'README.md';

  const truePositives = auditResult?.findings.filter((f) => f.isVulnerable) || [];
  const falsePositives = auditResult?.findings.filter((f) => !f.isVulnerable) || [];

  return (
    <div className="cursor-agent-container">
      {/* 1. Header Bar: AI Assistant Title & More Options */}
      <div className="cursor-agent-header">
        <div className="cursor-header-title-box">
          <div className="cursor-header-sparkle-icon">
            <Sparkles size={16} />
          </div>
          <span className="cursor-header-title">AI Assistant</span>
        </div>

        <div className="cursor-header-right-tools">
          <button
            className="cursor-start-over-btn"
            onClick={onRunAudit}
            disabled={isAuditing}
            title="Restart Audit"
          >
            <RotateCcw size={11} className={isAuditing ? 'animate-spin' : ''} />
            <span>Reset</span>
          </button>
          <button className="cursor-more-btn" title="Options">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="cursor-chat-body" ref={chatScrollRef}>
        {/* User Message Bubble */}
        {promptText.trim().length > 0 && (
          <div className="cursor-user-row">
            <div className="cursor-user-bubble">{promptText}</div>
          </div>
        )}

        {/* State A: Auditing in Progress */}
        {isAuditing && (
          <div className="cursor-assistant-block">
            <div className="cursor-thinking-label">
              <span className="shining-text">Analyzing Workspace</span>
              <span className="cursor-dot-pulse shining-text">...</span>
            </div>

            <p className="cursor-prose-intro">
              I’m checking the code in the workspace to pinpoint the actual error and
              narrow it down to the relevant file or script.
            </p>

            {/* Tree Steps */}
            <div className="cursor-step-tree">
              <div className="cursor-step-item">
                <Search size={12} className="cursor-step-icon" />
                <span>Ingested OSV, Trivy &amp; Grype union findings</span>
              </div>
              <div className="cursor-tree-line" />

              {activeStepIdx >= 1 && (
                <>
                  <div className="cursor-step-item">
                    <Search size={12} className="cursor-step-icon" />
                    <span>
                      Read <span className="cursor-chip"><Folder size={11} className="inline mr-1 text-amber-500" />src/router/routes</span>
                    </span>
                  </div>
                  <div className="cursor-tree-line" />
                </>
              )}

              {activeStepIdx >= 2 && (
                <>
                  <div className="cursor-step-item">
                    <Search size={12} className="cursor-step-icon" />
                    <span>
                      Searched for files matching{' '}
                      <span className="cursor-chip">axios</span> •{' '}
                      <span className="cursor-chip">**/*.js</span>, 2 matches
                    </span>
                  </div>
                  <div className="cursor-tree-line" />
                </>
              )}

              {activeStepIdx >= 3 && (
                <>
                  <div className="cursor-step-item">
                    <BookOpen size={12} className="cursor-step-icon" />
                    <span>
                      Read <span className="cursor-chip"><Code2 size={11} className="inline mr-1 text-blue-600" />system.js</span>, lines 70 to 88
                    </span>
                  </div>
                  <div className="cursor-tree-line" />
                </>
              )}

              <div className="cursor-step-item active">
                <span className="cursor-live-bullet">•</span>
                <span className="shining-text-subtle">
                  {activeStepIdx < 4
                    ? 'Preparing AST context for Gemini Cyber Engine...'
                    : 'Evaluating AST invocation and synthesizing remediation fix...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* State B: Audit Finished & Results Available */}
        {!isAuditing && auditResult && (
          <div className="cursor-assistant-block">
            <p className="cursor-prose-intro">
              I’ve audited the workspace code to pinpoint security findings and AST call site vulnerabilities.
            </p>

            {/* Collapsible Reviewed Step Summary */}
            <div
              className="cursor-summary-toggle"
              onClick={() => setShowSteps(!showSteps)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {showSteps ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                <span>
                  Reviewed {auditResult.totalRepoFiles} files and analyzed vulnerabilities
                </span>
              </div>
            </div>

            {showSteps && (
              <div className="cursor-step-tree" style={{ marginBottom: 16 }}>
                <div className="cursor-step-item">
                  <Search size={12} className="cursor-step-icon" />
                  <span>Checked {auditResult.totalRepoFiles} files, detected candidate call sites</span>
                </div>
                <div className="cursor-tree-line" />
                <div className="cursor-step-item">
                  <BookOpen size={12} className="cursor-step-icon" />
                  <span>
                    Read <span className="cursor-chip"><Code2 size={11} className="inline mr-1 text-blue-600" />system.js</span>, lines 70 to 88
                  </span>
                </div>
                <div className="cursor-tree-line" />
                <div className="cursor-step-item">
                  <Search size={12} className="cursor-step-icon" />
                  <span>
                    RAG Knowledge Base matched <span className="cursor-chip">CVE-2026-44495 in axios</span>
                  </span>
                </div>
                <div className="cursor-tree-line" />
                <div className="cursor-step-item">
                  <CheckCircle2 size={12} className="cursor-step-icon success" />
                  <span>
                    Gemini Flash balanced AST confirmed {auditResult.truePositivesCount} true positive(s), filtered {auditResult.falsePositivesCount} safe file(s)
                  </span>
                </div>
              </div>
            )}

            {/* True Positives / Vulnerable Call Sites */}
            {truePositives.map((vuln, idx) => {
              const vulnerableSnippet =
                vuln.vulnerableCodeSnippet ||
                (vuln.package === 'lodash'
                  ? 'const compiled = _.template(userTemplate);'
                  : vuln.file.includes('system.js') || vuln.package === 'axios'
                  ? 'requests.get(url)'
                  : `${vuln.package}(...)`);

              const fileName = vuln.file.split('/').pop() || vuln.file;

              return (
                <div key={idx} className="cursor-finding-section">
                  <div className="cursor-prose-text" style={{ marginTop: 12 }}>
                    Identified security call site in workspace scripts:
                  </div>

                  {/* File Bullet Row */}
                  <ul className="cursor-file-bullet-list">
                    <li>
                      <span className="cursor-bullet-dot">•</span>
                      <button
                        className="cursor-chip clickable"
                        onClick={() => onSelectFinding(vuln)}
                        title="Jump to line in Monaco Editor"
                      >
                        <Code2 size={11} className="text-blue-600" />
                        <span>{fileName}</span>
                      </button>
                    </li>
                  </ul>

                  {/* Multi-line Code Snippet Box */}
                  <div className="cursor-code-box">
                    <pre className="cursor-code-pre">
                      <code>{vulnerableSnippet}</code>
                    </pre>
                  </div>

                  {/* Dependencies */}
                  <div className="cursor-prose-text" style={{ marginTop: 12 }}>
                    Vulnerability Context:
                  </div>

                  <ul className="cursor-bullet-list">
                    <li>
                      Package dependency: <span className="cursor-chip font-medium text-slate-800">{vuln.package}</span>
                    </li>
                    {vuln.vulnerableLines.length > 0 && (
                      <li>
                        Line {vuln.vulnerableLines[0]} invoking <code>{vuln.inlineSafeAlternative || (vulnerableSnippet.includes('\n') ? vulnerableSnippet.split('\n')[0].trim() : vulnerableSnippet)}</code> with untrusted input
                      </li>
                    )}
                    <li>
                      {vuln.reason.split('.')[0] || 'untrusted parameter passed directly into function execution'}
                    </li>
                  </ul>

                  <div className="cursor-prose-text" style={{ marginTop: 12 }}>
                    Security Advisories:
                  </div>

                  <ul className="cursor-bullet-list">
                    <li>
                      <span className="cursor-chip error-chip">{vuln.cve_id}</span>
                      {' '}{vuln.reason.includes('injection') ? 'Command Injection / Remote Execution' : 'Security Vulnerability & Data Leakage'}
                    </li>
                  </ul>

                  {/* Recommended Safe Fix */}
                  <div className="cursor-section-title">Recommended Remediation</div>

                  <div className="cursor-fix-code-block">
                    <div className="cursor-fix-top">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                        <ShieldCheck size={13} className="text-emerald-600" />
                        <span>Safe Alternative</span>
                      </div>
                      <button
                        className="cursor-copy-btn"
                        onClick={() => handleCopyCode(vuln.safeAlternative, idx)}
                        title="Copy fix to clipboard"
                      >
                        {copiedIdx === idx ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <pre className="cursor-code-pre">
                      <code>{vuln.safeAlternative}</code>
                    </pre>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button
                      className="cursor-inline-jump-btn"
                      onClick={() => onSelectFinding(vuln)}
                    >
                      <Code2 size={12} className="text-blue-600" />
                      <span>Highlight &amp; View in Monaco Editor</span>
                      <ExternalLink size={11} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* False Positives */}
            {falsePositives.length > 0 && (
              <div className="cursor-safe-files-toggle-box">
                <button
                  className="cursor-safe-toggle-btn"
                  onClick={() => setShowSafeFiles(!showSafeFiles)}
                >
                  {showSafeFiles ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  <span>Reviewed {falsePositives.length} safe files (false positives filtered)</span>
                </button>

                {showSafeFiles && (
                  <div className="cursor-safe-list">
                    {falsePositives.slice(0, 8).map((safe, sIdx) => (
                      <div key={sIdx} className="cursor-safe-item" onClick={() => onSelectFinding(safe)}>
                        <span className="cursor-chip"><Code2 size={11} className="inline mr-1 text-slate-500" />{safe.file}</span>
                        <span className="cursor-safe-reason">{safe.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* State C: Initial Ready State with iOS-Level Neatness matching Image 2 */}
        {!isAuditing && !auditResult && (
          <div className="cursor-assistant-block">
            {/* Assistant Greeting Card */}
            <div className="cursor-welcome-hero">
              <div className="cursor-welcome-avatar">
                <Sparkles size={20} className="text-white" />
              </div>
              <p className="cursor-welcome-text">
                I’m ready to audit your workspace code for security vulnerabilities, AST dataflow issues, and dependency exploits.
              </p>
            </div>

            {/* Suggested Workflows Section */}
            <div className="cursor-workflows-section">
              <div className="cursor-workflows-heading">Suggested workflows:</div>

              <div className="cursor-ios-cards-group">
                {/* 1. Audit repository card */}
                <button
                  className="cursor-ios-card"
                  onClick={onRunAudit}
                  title="Run repository vulnerability audit"
                >
                  <div className="cursor-ios-card-icon-box blue">
                    <Shield size={16} />
                  </div>
                  <span className="cursor-ios-card-text">
                    Audit repository vulnerabilities &amp; AST call sites
                  </span>
                  <ChevronRight size={15} className="cursor-ios-card-chevron" />
                </button>

                {/* 2. Lodash CVE Demo */}
                {onLoadPreset && (
                  <button
                    className="cursor-ios-card"
                    onClick={() => onLoadPreset('lodash-vuln')}
                    title="Load Lodash CVE Exploit Demo"
                  >
                    <div className="cursor-ios-card-icon-box amber">
                      <Zap size={16} />
                    </div>
                    <span className="cursor-ios-card-text">
                      Lodash CVE-2021-23337 Exploit Demo
                    </span>
                    <ChevronRight size={15} className="cursor-ios-card-chevron" />
                  </button>
                )}

                {/* 3. False-Positive Filter Demo */}
                {onLoadPreset && (
                  <button
                    className="cursor-ios-card"
                    onClick={() => onLoadPreset('safe-filter')}
                    title="Load False-Positive Filter Demo"
                  >
                    <div className="cursor-ios-card-icon-box blue">
                      <Shield size={16} />
                    </div>
                    <span className="cursor-ios-card-text">
                      False-Positive Filter Demo (Safe Usage)
                    </span>
                    <ChevronRight size={15} className="cursor-ios-card-chevron" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Scroll-To-Bottom Button */}
      <button
        className="cursor-scroll-bottom-btn"
        onClick={scrollToBottom}
        title="Scroll to bottom"
      >
        <ArrowDown size={13} />
      </button>

      {/* 3. Bottom Interactive Prompt Box (iOS level neatness) */}
      <div className="cursor-prompt-container">
        <form onSubmit={handleSendPrompt} className="cursor-prompt-box">
          {/* Active File Context Chip */}
          {showAttachedChip && (
            <div className="cursor-chip-row">
              <div className="cursor-file-chip">
                <Code2 size={12} className="text-blue-600" />
                <span>{activeFileName}</span>
                <button
                  type="button"
                  onClick={() => setShowAttachedChip(false)}
                  className="cursor-chip-close"
                  title="Remove context"
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          )}

          {/* Prompt Textarea Input */}
          <textarea
            className="cursor-prompt-textarea"
            placeholder="Ask a question about vulnerabilities or describe what to audit..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt(e);
              }
            }}
            rows={2}
          />

          {/* Bottom Toolbar Row */}
          <div className="cursor-prompt-bottom-bar">
            <div className="cursor-prompt-tools-left">
              <button
                type="button"
                className="cursor-tool-btn"
                title="Add context"
                onClick={() => setShowAttachedChip(true)}
              >
                <Plus size={13} />
              </button>
              <div className="cursor-agent-pill">
                <Code2 size={11} />
                <span>Agent</span>
              </div>
              <div className="cursor-agent-pill">
                <Zap size={11} className="text-amber-500" />
                <span>Auto</span>
              </div>
              <div className="cursor-agent-pill">
                <SlidersHorizontal size={11} />
                <span>Balance</span>
              </div>
              <button type="button" className="cursor-tool-btn" title="More options">
                <MoreHorizontal size={13} />
              </button>
            </div>

            <div className="cursor-prompt-tools-right">
              <button
                type="button"
                className="cursor-icon-btn"
                title="Voice input"
              >
                <Mic size={13} />
              </button>
              <button
                type="submit"
                className="cursor-send-btn"
                disabled={isAuditing}
                title="Send Prompt / Run Audit"
              >
                {isAuditing ? (
                  <div className="cursor-square-stop" />
                ) : (
                  <Send size={12} />
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer info line */}
        <div className="cursor-prompt-footer">
          <div className="cursor-footer-left">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              <span>Local</span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} className="text-slate-400" />
              <span>Default permissions</span>
            </span>
          </div>
          <div className="cursor-footer-right">
            <span className="cursor-footer-indicator" />
          </div>
        </div>
      </div>
    </div>
  );
};
