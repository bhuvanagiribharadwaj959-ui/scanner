'use client';

import React, { useRef, useEffect, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import {
  Loader2,
  Code2,
  ShieldAlert,
  Copy,
  Check,
  Zap,
  CornerDownRight,
  ArrowDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { OpenFile } from '@/types/github';
import { AiFileAnalysis } from '@/types/scanner';

interface CodeEditorProps {
  activeFile: OpenFile | null;
  onOpenSample: (url: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  analysis?: AiFileAnalysis | null;
  targetLine?: number | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  activeFile,
  onOpenSample,
  onCursorChange,
  analysis,
  targetLine,
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const viewZoneIdRef = useRef<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom iOS-clean light theme
    monaco.editor.defineTheme('ios-clean-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0070f3', fontStyle: 'bold' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'd97706' },
        { token: 'type', foreground: '2563eb' },
        { token: 'identifier', foreground: '1e293b' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#0f172a',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#007AFF',
        'editor.lineHighlightBackground': '#f8fafc',
        'editorGutter.background': '#ffffff',
        'editorCursor.foreground': '#007AFF',
        'editor.selectionBackground': '#e0f2fe',
        'editor.inactiveSelectionBackground': '#f1f5f9',
        'minimap.background': '#ffffff',
        'scrollbarSlider.background': 'rgba(148, 163, 184, 0.25)',
        'scrollbarSlider.hoverBackground': 'rgba(148, 163, 184, 0.45)',
        'scrollbarSlider.activeBackground': 'rgba(148, 163, 184, 0.65)',
      },
    });

    monaco.editor.setTheme('ios-clean-light');

    if (onCursorChange) {
      editor.onDidChangeCursorPosition((e: any) => {
        onCursorChange(e.position.lineNumber, e.position.column);
      });
    }

    applyVulnerabilityDecorations();
  };

  // Check if current active file matches analysis file
  const isFileMatchingAnalysis =
    Boolean(analysis && activeFile) &&
    (activeFile?.path === analysis?.file ||
      activeFile?.path.endsWith(analysis?.file || '') ||
      analysis?.file.endsWith(activeFile?.path || ''));

  // Apply or update Monaco line decorations and inline green alternative view zone
  const applyVulnerabilityDecorations = () => {
    if (!editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Clear existing view zone if present
    if (viewZoneIdRef.current !== null) {
      const oldZone = viewZoneIdRef.current;
      editor.changeViewZones((changeAccessor: any) => {
        changeAccessor.removeZone(oldZone);
      });
      viewZoneIdRef.current = null;
    }

    if (!isFileMatchingAnalysis || !analysis || !analysis.isVulnerable) {
      // Clear decorations
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    const newDecorations: any[] = [];

    // 1. Red highlighting for imported module line
    for (const importLine of analysis.importLines || []) {
      newDecorations.push({
        range: new monaco.Range(importLine, 1, importLine, 1),
        options: {
          isWholeLine: true,
          className: 'monaco-vuln-import-line',
          glyphMarginClassName: 'monaco-vuln-import-glyph',
          overviewRuler: {
            color: '#ef4444',
            position: monaco.editor.OverviewRulerLane.Right,
          },
          hoverMessage: {
            value: `**[Vulnerable Dependency Import]**\nPackage \`${analysis.package}\` is imported here. Known CVE: **${analysis.cve_id}**.`,
          },
        },
      });
    }

    // 2. Red highlighting for vulnerable method invocation line(s)
    for (const vulnLine of analysis.vulnerableLines || []) {
      newDecorations.push({
        range: new monaco.Range(vulnLine, 1, vulnLine, 1),
        options: {
          isWholeLine: true,
          className: 'monaco-vuln-call-line',
          glyphMarginClassName: 'monaco-vuln-call-glyph',
          overviewRuler: {
            color: '#ef4444',
            position: monaco.editor.OverviewRulerLane.Full,
          },
          hoverMessage: {
            value: `### Security Finding: ${analysis.cve_id}\n\n**Reason:** ${analysis.reason}\n\n**Recommended Safe Alternative:**\n\`\`\`javascript\n${analysis.safeAlternative}\n\`\`\``,
          },
        },
      });
    }

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);

    // 3. Inject Inline Green Safe Alternative ViewZone right below vulnerable call line
    if (analysis.vulnerableLines && analysis.vulnerableLines.length > 0 && analysis.inlineSafeAlternative) {
      const targetVulnLine = analysis.vulnerableLines[0];

      editor.changeViewZones((changeAccessor: any) => {
        const domNode = document.createElement('div');
        domNode.className = 'monaco-inline-safe-zone';
        domNode.style.display = 'flex';
        domNode.style.alignItems = 'center';
        domNode.style.justifyContent = 'space-between';
        domNode.style.padding = '3px 12px 3px 28px';
        domNode.style.background = 'rgba(16, 185, 129, 0.08)';
        domNode.style.borderLeft = '3px solid #10b981';
        domNode.style.fontSize = '12px';
        domNode.style.fontFamily = "'SF Mono', 'Fira Code', Consolas, Monaco, monospace";
        domNode.style.color = '#047857';
        domNode.style.userSelect = 'text';

        const leftBox = document.createElement('div');
        leftBox.style.display = 'flex';
        leftBox.style.alignItems = 'center';
        leftBox.style.gap = '8px';
        leftBox.style.overflow = 'hidden';

        const tag = document.createElement('span');
        tag.innerText = 'Safe Fix:';
        tag.style.fontWeight = '600';
        tag.style.color = '#059669';
        tag.style.fontSize = '11px';

        const codeSpan = document.createElement('span');
        codeSpan.innerText = analysis.inlineSafeAlternative || '';
        codeSpan.style.color = '#047857';
        codeSpan.style.fontWeight = '500';

        leftBox.appendChild(tag);
        leftBox.appendChild(codeSpan);

        const copyBtn = document.createElement('button');
        copyBtn.innerText = 'Copy';
        copyBtn.style.background = '#ffffff';
        copyBtn.style.border = '1px solid #a7f3d0';
        copyBtn.style.borderRadius = '4px';
        copyBtn.style.color = '#059669';
        copyBtn.style.padding = '1px 7px';
        copyBtn.style.fontSize = '10px';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.marginLeft = '8px';
        copyBtn.style.flexShrink = '0';
        copyBtn.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(analysis.inlineSafeAlternative || '');
          copyBtn.innerText = 'Copied';
          setTimeout(() => {
            copyBtn.innerText = 'Copy';
          }, 1500);
        };

        domNode.appendChild(leftBox);
        domNode.appendChild(copyBtn);

        const zoneId = changeAccessor.addZone({
          afterLineNumber: targetVulnLine,
          heightInLines: 1.6,
          domNode,
        });

        viewZoneIdRef.current = zoneId;
      });
    }
  };

  // Re-apply decorations whenever analysis or active file changes
  useEffect(() => {
    applyVulnerabilityDecorations();
  }, [analysis, activeFile]);

  // Jump to targetLine if specified
  useEffect(() => {
    if (targetLine && editorRef.current) {
      editorRef.current.revealLineInCenter(targetLine);
      editorRef.current.setPosition({ lineNumber: targetLine, column: 1 });
      editorRef.current.focus();
    }
  }, [targetLine]);

  if (!activeFile) {
    return (
      <div className="editor-welcome-screen">
        <div className="welcome-logo">
          <Code2 size={48} className="text-blue-600" />
        </div>
        <h2 className="welcome-title">Security Workspace</h2>
        <p className="welcome-subtitle">
          Select a file from the Explorer sidebar on the left or load a repository using the search bar above to begin reviewing vulnerabilities.
        </p>

        <div className="welcome-shortcuts">
          <div className="welcome-shortcut-item">
            <span className="kbd-badge">Ctrl+P</span>
            <span>Quick Open Files</span>
          </div>
          <div className="welcome-shortcut-item">
            <span className="kbd-badge">Ctrl+Shift+F</span>
            <span>Search in Repository</span>
          </div>
          <div className="welcome-shortcut-item">
            <span className="kbd-badge">Ctrl+`</span>
            <span>Toggle Security Terminal</span>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            className="preset-chip"
            onClick={() => onOpenSample('https://github.com/octocat/Hello-World')}
          >
            octocat/Hello-World
          </button>
          <button
            className="preset-chip"
            onClick={() => onOpenSample('https://github.com/expressjs/express')}
          >
            expressjs/express
          </button>
          <button
            className="preset-chip"
            onClick={() => onOpenSample('https://github.com/facebook/react')}
          >
            facebook/react
          </button>
        </div>
      </div>
    );
  }

  if (activeFile.loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 12,
          color: '#64748b',
        }}
      >
        <Loader2 size={28} className="animate-spin" color="#007AFF" />
        <span style={{ fontSize: 13 }}>Loading {activeFile.name}...</span>
      </div>
    );
  }

  if (activeFile.error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 12,
          padding: 24,
          color: '#1e293b',
          textAlign: 'center',
        }}
      >
        <ShieldAlert size={36} color="#ef4444" />
        <div style={{ fontSize: 15, fontWeight: 500 }}>Unable to render file</div>
        <div style={{ fontSize: 12, color: '#64748b', maxWidth: 450 }}>
          {activeFile.error}
        </div>
      </div>
    );
  }

  return (
    <div className="monaco-container-wrapper">
      <div className="monaco-wrapper">
        <Editor
          height="100%"
          path={activeFile.path}
          language={activeFile.language || 'plaintext'}
          value={activeFile.content}
          theme="ios-clean-light"
          onMount={handleEditorDidMount}
          options={{
            readOnly: true,
            domReadOnly: true,
            minimap: { enabled: true, side: 'right' },
            fontSize: 13,
            fontFamily: "'SF Mono', 'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
            lineHeight: 21,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: 'on',
            glyphMargin: true,
            renderWhitespace: 'none',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            folding: true,
            padding: { top: 12, bottom: 12 },
            wordWrap: 'off',
            overviewRulerBorder: false,
          }}
          loading={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 8,
                color: '#64748b',
              }}
            >
              <Loader2 size={20} className="animate-spin text-blue-600" />
              <span>Initializing Monaco Editor...</span>
            </div>
          }
        />
      </div>
    </div>
  );
};
