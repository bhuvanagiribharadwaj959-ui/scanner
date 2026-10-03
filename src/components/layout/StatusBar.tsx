'use client';

import React from 'react';
import { GitBranch, RefreshCw, AlertTriangle, XCircle, Lock } from 'lucide-react';

interface StatusBarProps {
  branch: string;
  cursorLine: number;
  cursorCol: number;
  language: string;
  totalFiles: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  branch,
  cursorLine,
  cursorCol,
  language,
  totalFiles,
}) => {
  return (
    <footer className="vscode-statusbar">
      <div className="statusbar-left">
        {/* User Initial Circle Dot */}
        <div className="statusbar-avatar" title="Signed in as Developer">
          <span>N</span>
        </div>

        {branch ? (
          <div className="statusbar-item" title={`Active Branch: ${branch}`}>
            <GitBranch size={12} />
            <span>{branch}*</span>
          </div>
        ) : (
          <div className="statusbar-item">
            <GitBranch size={12} />
            <span>main*</span>
          </div>
        )}

        <div className="statusbar-item" title="Synchronize Changes">
          <RefreshCw size={11} />
        </div>

        <div className="statusbar-item" title="0 Warnings, 0 Errors">
          <AlertTriangle size={11} className="text-amber-500" />
          <span>0</span>
        </div>

        <div className="statusbar-item" title="0 Errors">
          <XCircle size={11} className="text-slate-400" />
          <span>0</span>
        </div>

        {totalFiles > 0 && (
          <div className="statusbar-item" style={{ opacity: 0.9 }}>
            <span>{totalFiles} files indexed</span>
          </div>
        )}
      </div>

      <div className="statusbar-right">
        <div className="statusbar-item" title="Cursor Line and Column">
          <span>Ln {cursorLine}, Col {cursorCol}</span>
        </div>

        <div className="statusbar-item" title="Indentation">
          <span>Spaces: 2</span>
        </div>

        <div className="statusbar-item" title="Character Encoding">
          <span>UTF-8</span>
        </div>

        <div className="statusbar-item" title="End of Line Sequence">
          <span>LF</span>
        </div>

        <div className="statusbar-item" title="Language Mode" style={{ textTransform: 'capitalize' }}>
          <span>{language || 'Markdown'}</span>
        </div>

        <div
          className="statusbar-item statusbar-readonly-badge"
          title="Code editor and terminal are in read-only security mode"
        >
          <Lock size={11} />
          <span>Read-Only</span>
        </div>
      </div>
    </footer>
  );
};
