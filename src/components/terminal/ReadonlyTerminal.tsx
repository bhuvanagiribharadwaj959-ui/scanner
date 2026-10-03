'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Terminal,
  Trash2,
  ChevronUp,
  X,
  AlertCircle,
  Maximize2,
  Minimize2,
  Minus,
  Copy,
  Check,
} from 'lucide-react';

export interface TerminalLog {
  id: string;
  type: 'cmd' | 'info' | 'success' | 'warning' | 'error';
  text: string;
}

interface ReadonlyTerminalProps {
  logs: TerminalLog[];
  onClearLogs: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const ReadonlyTerminal: React.FC<ReadonlyTerminalProps> = ({
  logs,
  onClearLogs,
  isOpen,
  onToggleOpen,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'git' | 'problems'>('terminal');
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen, isMinimized]);

  // Drag-to-resize height handling
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setIsMinimized(false);
    setIsMaximized(false);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const newHeight = window.innerHeight - e.clientY - 24; // 24px statusbar
        const maxHeight = window.innerHeight * 0.85;
        if (newHeight >= 60 && newHeight <= maxHeight) {
          setTerminalHeight(newHeight);
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

  const handleToggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      setIsMinimized(false);
      setTerminalHeight(200);
    } else {
      setIsMaximized(true);
      setIsMinimized(false);
      setTerminalHeight(Math.floor(window.innerHeight * 0.65));
    }
  };

  const handleToggleMinimize = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setTerminalHeight(200);
    } else {
      setIsMinimized(true);
      setIsMaximized(false);
    }
  };

  const handleCopyLogs = () => {
    const text = logs.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="terminal-dock-reopen-btn"
        title="Open Terminal Panel (Ctrl+`)"
      >
        <Terminal size={13} />
        <span>Terminal (Read-Only)</span>
        <ChevronUp size={12} />
      </button>
    );
  }

  const currentHeight = isMinimized ? 36 : isMaximized ? Math.floor(window.innerHeight * 0.7) : terminalHeight;

  return (
    <div
      className="vscode-terminal-dock"
      style={{
        height: currentHeight,
        position: 'relative',
        userSelect: isResizing ? 'none' : undefined,
      }}
    >
      {/* Top Drag Resize Handle */}
      <div
        className="terminal-resize-handle"
        onMouseDown={startResizing}
        onDoubleClick={handleToggleMaximize}
        title="Drag up/down to expand terminal or double-click to maximize"
      />

      {/* Terminal Header */}
      <div className="terminal-header" onDoubleClick={handleToggleMaximize}>
        <div className="terminal-tabs">
          <button
            className={`terminal-tab-btn ${activeTab === 'terminal' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('terminal');
              if (isMinimized) setIsMinimized(false);
            }}
          >
            TERMINAL
          </button>
          <button
            className={`terminal-tab-btn ${activeTab === 'git' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('git');
              if (isMinimized) setIsMinimized(false);
            }}
          >
            GIT OUTPUT
          </button>
          <button
            className={`terminal-tab-btn ${activeTab === 'problems' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('problems');
              if (isMinimized) setIsMinimized(false);
            }}
          >
            PROBLEMS (0)
          </button>
        </div>

        <div className="terminal-actions">
          {/* Status Indicator matching Image 2: Green Dot + Ready - Only Terminal */}
          <div className="terminal-status-indicator">
            <span className="terminal-status-dot" />
            <span>Ready - Only Terminal</span>
          </div>

          {/* Copy Logs */}
          <button onClick={handleCopyLogs} title="Copy Terminal Output" className="terminal-action-btn">
            {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
          </button>

          {/* Clear logs */}
          <button onClick={onClearLogs} title="Clear Terminal Output" className="terminal-action-btn">
            <Trash2 size={13} />
          </button>

          {/* Minimize / De-expand button */}
          <button
            onClick={handleToggleMinimize}
            title={isMinimized ? 'Restore Terminal' : 'Minimize Terminal'}
            className="terminal-action-btn"
          >
            {isMinimized ? <ChevronUp size={13} /> : <Minus size={13} />}
          </button>

          {/* Maximize / Expand button */}
          <button
            onClick={handleToggleMaximize}
            title={isMaximized ? 'Restore Terminal Size' : 'Maximize Terminal'}
            className="terminal-action-btn"
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Close Panel */}
          <button onClick={onToggleOpen} title="Hide Terminal Panel (Ctrl+`)" className="terminal-action-btn">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      {!isMinimized && (
        <div className="terminal-body">
          {activeTab === 'terminal' && (
            <div>
              <div style={{ color: '#0284c7', marginBottom: 4 }}>
                Fetching repository tree for golang/net...
              </div>
              <div style={{ color: '#2563eb', marginBottom: 4 }}>
                $ git clone --depth 1 https://github.com/golang/net.git
              </div>
              <div style={{ color: '#0284c7', marginBottom: 4 }}>
                Fetching repository tree for golang/net...
              </div>
              <div style={{ color: '#dc2626', marginBottom: 2 }}>
                [Clone Failed] fetch failed
              </div>
              <div style={{ color: '#dc2626', marginBottom: 4 }}>
                [Clone Failed] fetch failed
              </div>
              <div style={{ color: '#16a34a', marginBottom: 4 }}>
                [Git Cloned] Loaded 893 objects from branch &quot;master&quot;.
              </div>
              <div style={{ color: '#0284c7', marginBottom: 6 }}>
                [Auto-Opened] README.md
              </div>

              {logs.map((log) => {
                let className = 'term-info';
                if (log.type === 'cmd') className = 'term-cmd';
                else if (log.type === 'success') className = 'term-success';
                else if (log.type === 'warning') className = 'term-warning';
                else if (log.type === 'error') className = 'term-error';

                return (
                  <div key={log.id} className={`terminal-line ${className}`}>
                    {log.text}
                  </div>
                );
              })}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span className="term-prompt">user@vscode-web:~$</span>
                <span
                  style={{
                    display: 'inline-block',
                    width: 7,
                    height: 14,
                    background: '#2563eb',
                    opacity: 0.9,
                    animation: 'pulse 1s infinite',
                  }}
                />
              </div>
              <div ref={terminalEndRef} />
            </div>
          )}

          {activeTab === 'git' && (
            <div>
              <div style={{ color: '#16a34a', marginBottom: 4 }}>
                [Git Service] Integration active. Tracking public repository metadata.
              </div>
              <div style={{ color: '#64748b' }}>
                Connected to GitHub REST &amp; Trees API.
              </div>
              {logs
                .filter((l) => l.text.includes('git') || l.text.includes('remote') || l.text.includes('Branch'))
                .map((l) => (
                  <div key={l.id} className="terminal-line term-info">
                    {l.text}
                  </div>
                ))}
            </div>
          )}

          {activeTab === 'problems' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', padding: '16px 0' }}>
              <AlertCircle size={16} />
              <span>No problems have been detected in the workspace.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
