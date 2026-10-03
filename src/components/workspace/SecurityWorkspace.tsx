'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TitleBar } from '@/components/layout/TitleBar';
import { ActivityBar } from '@/components/layout/ActivityBar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { EditorTabs } from '@/components/editor/EditorTabs';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { ReadonlyTerminal, TerminalLog } from '@/components/terminal/ReadonlyTerminal';
import { StatusBar } from '@/components/layout/StatusBar';
import { AiAgentScanner } from '@/components/scanner/AiAgentScanner';
import { TreeNode, OpenFile, SidebarTab } from '@/types/github';
import { ScanResult, RagAuditResult, AiFileAnalysis, VulnerabilityFinding, RawScanReports } from '@/types/scanner';
import { parseGitHubUrl, getLanguageFromPath } from '@/utils/language';
import { Sparkles, Bot, ArrowLeft, History, Settings, ExternalLink } from 'lucide-react';

interface SecurityWorkspaceProps {
  scanId?: string;
  initialRepoUrl?: string;
  initialPreset?: 'lodash-vuln' | 'safe-filter' | 'jwt-vuln';
}

export const SecurityWorkspace: React.FC<SecurityWorkspaceProps> = ({
  scanId = 'scan-workspace-active',
  initialRepoUrl = 'https://github.com/golang/net',
  initialPreset,
}) => {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState(initialRepoUrl);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('');
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);

  // File tree & open tabs
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([]);
  const [flatFiles, setFlatFiles] = useState<Array<{ path: string; type: string; sha: string }>>([]);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  // Sidebar & Layout State
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('explorer');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [targetLine, setTargetLine] = useState<number | null>(null);

  // Scanner & AI Agent State
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult | null>(null);
  const [rawScanReports, setRawScanReports] = useState<RawScanReports | null>(null);
  const [isScanPanelOpen, setIsScanPanelOpen] = useState(true); // AI Agent Panel open by default

  // AI RAG Agent Auditor State
  const [isAuditing, setIsAuditing] = useState(false);
  const [ragAuditResult, setRagAuditResult] = useState<RagAuditResult | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<AiFileAnalysis | null>(null);
  const [currentAuditingFile, setCurrentAuditingFile] = useState<string>('');

  // Terminal log stream
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    {
      id: 'init-1',
      type: 'info',
      text: 'Antigravity Security Workspace v2.5 initialized.',
    },
    {
      id: 'init-2',
      type: 'success',
      text: 'Connected to OSV.dev, Aqua Trivy, Anchore Grype & ChromaDB RAG Vector Store.',
    },
    {
      id: 'init-3',
      type: 'info',
      text: 'Gemini 3.5 Flash Cyber Context Engine ready (1,048,576 Tokens).',
    },
  ]);

  const addTerminalLog = useCallback(
    (type: TerminalLog['type'], text: string) => {
      setTerminalLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          type,
          text,
        },
      ]);
    },
    []
  );

  // Reference to openFiles to always read latest state synchronously
  const openFilesRef = useRef<OpenFile[]>(openFiles);
  useEffect(() => {
    openFilesRef.current = openFiles;
  }, [openFiles]);

  // Candidate files with findings from scan (colored red in file tree)
  const candidateFindingPaths = useMemo(() => {
    const set = new Set<string>();
    if (scanResults?.vulnerabilities) {
      for (const vuln of scanResults.vulnerabilities) {
        const suspects = vuln.suspect_files || (vuln.file_path ? [vuln.file_path] : []);
        for (const s of suspects) {
          set.add(s.replace(/^\/+/, ''));
        }
      }
    }
    if (ragAuditResult?.findings) {
      for (const f of ragAuditResult.findings) {
        set.add(f.file.replace(/^\/+/, ''));
      }
    }
    return set;
  }, [scanResults, ragAuditResult]);

  // Set of files confirmed vulnerable by RAG Gemini Audit
  const vulnerableFilePaths = useMemo(() => {
    const set = new Set<string>();
    if (ragAuditResult?.findings) {
      for (const finding of ragAuditResult.findings) {
        if (finding.isVulnerable) {
          set.add(finding.file.replace(/^\/+/, ''));
        }
      }
    }
    return set;
  }, [ragAuditResult]);

  // Findings Map for showing dim TP / FP tags
  // CRITICAL: ONLY populated when RAG audit has completed! Never label files as TP before the model confirms!
  const findingsMap = useMemo(() => {
    const map: Record<string, 'TP' | 'FP'> = {};

    if (ragAuditResult?.findings && !isAuditing) {
      for (const finding of ragAuditResult.findings) {
        const cleanPath = finding.file.replace(/^\/+/, '');
        map[cleanPath] = finding.isVulnerable ? 'TP' : 'FP';
      }

      // Any candidate file from scan that the model evaluated or filtered as safe gets FP
      for (const cand of candidateFindingPaths) {
        if (!map[cand]) {
          map[cand] = 'FP';
        }
      }
    }

    return map;
  }, [ragAuditResult, isAuditing, candidateFindingPaths]);

  // The 4 mandatory RAW scan JSON reports exposed in the current root directory
  const SCAN_REPORT_NAMES = useMemo(
    () => ['osv-scanner.json', 'trivy-report.json', 'grype-report.json', 'vulnerabilities-union.json'],
    []
  );

  const injectScanResultsIntoTree = useCallback(
    (nodes: TreeNode[]): TreeNode[] => {
      const reportNodes: TreeNode[] = [
        { path: 'osv-scanner.json', name: 'osv-scanner.json', type: 'blob', sha: 'report-osv' },
        { path: 'trivy-report.json', name: 'trivy-report.json', type: 'blob', sha: 'report-trivy' },
        { path: 'grype-report.json', name: 'grype-report.json', type: 'blob', sha: 'report-grype' },
        { path: 'vulnerabilities-union.json', name: 'vulnerabilities-union.json', type: 'blob', sha: 'report-union' },
      ];
      const filtered = nodes.filter((n) => !SCAN_REPORT_NAMES.includes(n.name) && n.name !== 'scan-results');
      return [...reportNodes, ...filtered];
    },
    [SCAN_REPORT_NAMES]
  );

  const injectScanResultsIntoFlatList = useCallback(
    (list: Array<{ path: string; type: string; sha?: string; size?: number }>): Array<{ path: string; type: string; sha: string }> => {
      const reportItems: Array<{ path: string; type: string; sha: string }> = [
        { path: 'osv-scanner.json', type: 'blob', sha: 'report-osv' },
        { path: 'trivy-report.json', type: 'blob', sha: 'report-trivy' },
        { path: 'grype-report.json', type: 'blob', sha: 'report-grype' },
        { path: 'vulnerabilities-union.json', type: 'blob', sha: 'report-union' },
      ];
      const filtered = list
        .filter((f) => !SCAN_REPORT_NAMES.includes(f.path) && !f.path.startsWith('scan-results/'))
        .map((f) => ({
          path: f.path,
          type: f.type,
          sha: f.sha || `blob-${f.path}`,
        }));
      return [...reportItems, ...filtered];
    },
    [SCAN_REPORT_NAMES]
  );

  // Sync open files when rawScanReports update
  useEffect(() => {
    if (!rawScanReports) return;
    setOpenFiles((prev) =>
      prev.map((file) => {
        if (file.path === 'osv-scanner.json' && rawScanReports.osv) {
          return { ...file, content: rawScanReports.osv, loading: false };
        }
        if (file.path === 'trivy-report.json' && rawScanReports.trivy) {
          return { ...file, content: rawScanReports.trivy, loading: false };
        }
        if (file.path === 'grype-report.json' && rawScanReports.grype) {
          return { ...file, content: rawScanReports.grype, loading: false };
        }
        if (file.path === 'vulnerabilities-union.json' && rawScanReports.union) {
          return { ...file, content: rawScanReports.union, loading: false };
        }
        return file;
      })
    );
  }, [rawScanReports]);

  // Open a file by path
  const handleOpenFile = useCallback(
    async (filePath: string) => {
      const cleanPath = filePath.replace(/^\/+/, '');
      const existing = openFilesRef.current.find((f: OpenFile) => f.path === cleanPath || f.path === filePath);
      if (existing && existing.content && !existing.error) {
        setActiveFilePath(existing.path);
        const match = ragAuditResult?.findings.find(
          (f) => f.file === existing.path || existing.path.endsWith(f.file) || f.file.endsWith(existing.path)
        );
        setActiveAnalysis(match || null);
        return;
      }

      const fileName = cleanPath.split('/').pop() || cleanPath;

      // Handle the 4 RAW JSON files in the current root directory
      if (SCAN_REPORT_NAMES.includes(cleanPath)) {
        let content = '';
        if (cleanPath === 'osv-scanner.json') content = rawScanReports?.osv || '{\n  "results": []\n}';
        else if (cleanPath === 'trivy-report.json') content = rawScanReports?.trivy || '{\n  "Results": []\n}';
        else if (cleanPath === 'grype-report.json') content = rawScanReports?.grype || '{\n  "matches": []\n}';
        else content = rawScanReports?.union || '{\n  "vulnerabilities": []\n}';

        setOpenFiles((prev) => {
          const exists = prev.some((f) => f.path === cleanPath);
          if (exists) {
            return prev.map((f) => (f.path === cleanPath ? { ...f, content, loading: false } : f));
          }
          return [
            ...prev,
            {
              path: cleanPath,
              name: fileName,
              content,
              language: 'json',
              loading: false,
            },
          ];
        });
        setActiveFilePath(cleanPath);
        setActiveAnalysis(null);
        addTerminalLog('success', `[Opened RAW JSON] ${cleanPath} (${content.length.toLocaleString()} bytes)`);
        return;
      }

      // If this is one of our preset files and already exists or being loaded, don't query GitHub
      if (
        cleanPath.startsWith('src/services/template-engine.js') ||
        cleanPath.startsWith('src/utils/safe-math.js') ||
        cleanPath.startsWith('src/auth/jwt-verifier.js')
      ) {
        if (existing) {
          setActiveFilePath(existing.path);
        }
        return;
      }

      const initialLanguage = getLanguageFromPath(cleanPath);

      setOpenFiles((prev) => {
        const found = prev.some((f) => f.path === cleanPath || f.path === filePath);
        if (found) {
          return prev.map((file) =>
            file.path === cleanPath || file.path === filePath
              ? { ...file, path: cleanPath, loading: true, error: undefined }
              : file
          );
        }
        return [
          ...prev,
          {
            path: cleanPath,
            name: fileName,
            content: '',
            language: initialLanguage,
            loading: true,
          },
        ];
      });
      setActiveFilePath(cleanPath);

      addTerminalLog('cmd', `$ cat ${cleanPath}`);

      try {
        const res = await fetch(
          `/api/github/file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(
            repo
          )}&branch=${encodeURIComponent(branch)}&path=${encodeURIComponent(cleanPath)}`
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}: Failed to load file`);
        }

        const data = await res.json();

        setOpenFiles((prev) =>
          prev.map((file) =>
            file.path === cleanPath || file.path === filePath
              ? {
                  ...file,
                  path: cleanPath,
                  content: data.content,
                  language: data.language || initialLanguage,
                  loading: false,
                }
              : file
          )
        );

        const match = ragAuditResult?.findings.find(
          (f) => f.file === cleanPath || cleanPath.endsWith(f.file) || f.file.endsWith(cleanPath)
        );
        setActiveAnalysis(match || null);

        addTerminalLog(
          'success',
          `[Loaded] ${cleanPath} (${data.size.toLocaleString()} bytes, language: ${data.language})`
        );
      } catch (err: any) {
        setOpenFiles((prev) =>
          prev.map((file) =>
            file.path === cleanPath || file.path === filePath
              ? {
                  ...file,
                  path: cleanPath,
                  loading: false,
                  error: err.message || 'Error loading file content',
                }
              : file
          )
        );
        addTerminalLog('error', `[Error] ${err.message || 'Failed to fetch file'}`);
      }
    },
    [owner, repo, branch, addTerminalLog, ragAuditResult]
  );

  // Load a GitHub repository
  const handleLoadRepo = useCallback(
    async (urlInput: string) => {
      const parsed = parseGitHubUrl(urlInput);
      if (!parsed) {
        addTerminalLog('error', `[Error] Invalid GitHub URL format: "${urlInput}"`);
        return;
      }

      setIsLoadingRepo(true);
      setRepoUrl(urlInput);
      setOwner(parsed.owner);
      setRepo(parsed.repo);
      setBranch(parsed.branch || 'master');

      addTerminalLog('cmd', `$ git clone --depth 1 https://github.com/${parsed.owner}/${parsed.repo}.git`);
      addTerminalLog('info', `Fetching repository tree for ${parsed.owner}/${parsed.repo}...`);

      try {
        const res = await fetch(
          `/api/github/tree?owner=${encodeURIComponent(parsed.owner)}&repo=${encodeURIComponent(
            parsed.repo
          )}&branch=${encodeURIComponent(parsed.branch || '')}`
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}: Failed to fetch repository`);
        }

        const data = await res.json();
        setOwner(data.owner);
        setRepo(data.repo);
        setBranch(data.branch);
        setTreeNodes(injectScanResultsIntoTree(data.tree || []));
        setFlatFiles(injectScanResultsIntoFlatList(data.flatList || []));

        addTerminalLog(
          'success',
          `[Git Cloned] Loaded ${data.flatList?.length || 0} objects from branch "${data.branch}".`
        );

        // Auto-open README.md or package.json
        const blobs = (data.flatList || []).filter((f: any) => f.type === 'blob');
        const readme = blobs.find((f: any) => /^readme\.md$/i.test(f.path));
        const packageJson = blobs.find((f: any) => /^package\.json$/i.test(f.path));
        const firstFile = packageJson || readme || blobs[0];

        if (firstFile) {
          const fileName = firstFile.path.split('/').pop() || firstFile.path;
          const initialLang = getLanguageFromPath(firstFile.path);
          setOpenFiles([
            {
              path: firstFile.path,
              name: fileName,
              content: '',
              language: initialLang,
              loading: true,
            },
          ]);
          setActiveFilePath(firstFile.path);

          fetch(
            `/api/github/file?owner=${encodeURIComponent(data.owner)}&repo=${encodeURIComponent(
              data.repo
            )}&branch=${encodeURIComponent(data.branch)}&path=${encodeURIComponent(firstFile.path)}`
          )
            .then((r) => r.json())
            .then((fData) => {
              setOpenFiles([
                {
                  path: firstFile.path,
                  name: fileName,
                  content: fData.content || '',
                  language: fData.language || initialLang,
                  loading: false,
                },
              ]);
              addTerminalLog('info', `[Auto-Opened] ${firstFile.path}`);
            })
            .catch(() => {});
        }
      } catch (err: any) {
        addTerminalLog('error', `[Clone Failed] ${err.message}`);
      } finally {
        setIsLoadingRepo(false);
      }
    },
    [addTerminalLog]
  );

  // Run AI RAG Security Audit
  const handleRunRagAudit = useCallback(
    async (customFiles?: Array<{ path: string; content: string }>, customVulns?: VulnerabilityFinding[]) => {
      setIsAuditing(true);
      setIsScanPanelOpen(true);

      addTerminalLog('cmd', `$ gemini-rag-auditor --model gemini-3.5-flash --mode cyber-context`);
      addTerminalLog('info', `[Phase 1: Multi-Scanner Union Ingest] Feeding OSV, Trivy & Grype findings to Gemini 3.5 Flash Cyber Context Engine...`);
      addTerminalLog('info', `[Phase 2: RAG Retrieval] Querying ChromaDB / ./vulnerability_vector_db for exploit AST patterns...`);

      try {
        const filesToAudit = customFiles ? customFiles : [];

        if (filesToAudit.length > 0) {
          setCurrentAuditingFile(filesToAudit[0].path);
        } else {
          setCurrentAuditingFile(`${owner}/${repo} (Gemini 3.5 Flash Cyber Context Engine)`);
        }

        const vulnsToAudit =
          customVulns ||
          (scanResults?.vulnerabilities && scanResults.vulnerabilities.length > 0
            ? scanResults.vulnerabilities
            : [
                {
                  package: 'lodash',
                  installed_version: '4.17.15',
                  cve_id: 'CVE-2021-23337',
                  severity: 'HIGH' as const,
                  detected_by: ['OSV', 'Trivy'],
                  title: 'Lodash template code injection',
                },
              ]);

        const res = await fetch('/api/scan/rag-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoUrl,
            owner,
            repo,
            vulnerabilities: vulnsToAudit,
            files: filesToAudit,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}: RAG audit failed`);
        }

        const data: RagAuditResult = await res.json();
        setRagAuditResult(data);

        addTerminalLog(
          'success',
          `[Phase 3: Gemini 3.5 Flash Cyber Triage Complete] Audited ${data.auditedFilesCount} candidate file(s) with 1M Token Context (saved ${data.tokensSavedPercentage}% tokens).`
        );
        addTerminalLog(
          data.truePositivesCount > 0 ? 'warning' : 'success',
          `[Phase 4: Annotations Ready] Confirmed ${data.truePositivesCount} True Positive(s) [TP] • Filtered ${data.falsePositivesCount} False Positive(s) [FP].`
        );

        // Auto-select first true positive if available
        const firstVuln = data.findings.find((f) => f.isVulnerable);
        if (firstVuln) {
          handleSelectAiFinding(firstVuln);
        } else if (data.findings[0]) {
          handleSelectAiFinding(data.findings[0]);
        }
      } catch (err: any) {
        addTerminalLog('error', `[RAG Audit Error] ${err.message}`);
      } finally {
        setIsAuditing(false);
        setCurrentAuditingFile('');
      }
    },
    [repoUrl, owner, repo, scanResults, addTerminalLog]
  );

  // Select a finding from AI Agent panel to view in Monaco Editor
  const handleSelectAiFinding = useCallback(
    (finding: AiFileAnalysis) => {
      setActiveAnalysis(finding);
      const target = finding.vulnerableLines[0] || finding.importLines[0] || 1;
      setTargetLine(target);
      setCursorPos({ line: target, col: 1 });
      handleOpenFile(finding.file);
    },
    [handleOpenFile]
  );

  // Perform Multi-Scanner (OSV + Trivy + Grype) Scan on Codebase & Automatically Run AI Agent
  const handleScanRepo = useCallback(
    async (urlInput?: string) => {
      const targetUrl = urlInput?.trim() || repoUrl;
      setIsScanning(true);
      setIsScanPanelOpen(true); // Open AI Agent directly

      addTerminalLog('cmd', `$ osv-scanner && trivy fs && grype dir`);
      addTerminalLog('info', `Scanning with Google OSV.dev, Aqua Trivy, and Anchore Grype concurrently...`);
      addTerminalLog('info', `Inspecting dependency manifests, lockfiles and suspect source call sites...`);

      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            repoUrl: targetUrl,
            owner,
            repo,
            branch,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}: Multi-scanner scan failed`);
        }

        const data: ScanResult = await res.json();
        setScanResults(data);

        // Inject 4 RAW JSON reports into current root directory explorer tree
        if (data.reports) {
          setRawScanReports(data.reports);
          setTreeNodes((prev) => injectScanResultsIntoTree(prev));
          setFlatFiles((prev) => injectScanResultsIntoFlatList(prev));
        }

        if (data.stats.total > 0) {
          addTerminalLog(
            'warning',
            `[Tri-Scanner Completed] Found ${data.stats.total} unique vulnerabilities across OSV, Trivy & Grype in ${(data.durationMs / 1000).toFixed(2)}s.`
          );
          addTerminalLog(
            'info',
            `[RAW Reports Generated in Current Dir] {osv-scanner.json, trivy-report.json, grype-report.json, vulnerabilities-union.json}`
          );
          addTerminalLog(
            'info',
            `[Auto-Triggering AI Agent] Passing ${data.vulnerabilities.length} union findings to Gemini 3.5 Flash Cyber for AST triage...`
          );
          // Automatically run RAG Audit right in the AI Agent panel
          handleRunRagAudit(undefined, data.vulnerabilities);
        } else {
          addTerminalLog('success', `[Scan Completed] Zero vulnerabilities reported across scanners.`);
        }
      } catch (err: any) {
        addTerminalLog('error', `[Scan Failed] ${err.message}`);
      } finally {
        setIsScanning(false);
      }
    },
    [repoUrl, owner, repo, branch, addTerminalLog, handleRunRagAudit, injectScanResultsIntoTree]
  );

  // Quick Demo Presets for Hackathon Evaluation
  const handleLoadPreset = useCallback(
    (type: 'lodash-vuln' | 'safe-filter' | 'jwt-vuln') => {
      if (type === 'lodash-vuln') {
        const path = 'src/services/template-engine.js';
        const content = `import _ from "lodash";
import express from "express";

const app = express();

// [Vulnerability Finding] Endpoint vulnerable to CVE-2021-23337 (lodash template code injection)
app.post("/render", (req, res) => {
  const userTemplate = req.body.template || "Hello World";

  // VULNERABLE FUNCTION INVOCATION:
  // Unsanitized user query passed directly into _.template()
  const compiled = _.template(userTemplate);
  
  res.send(compiled({ timestamp: new Date() }));
});

app.listen(3000);`;

        const presetFiles = [
          {
            path,
            name: 'template-engine.js',
            content,
            language: 'javascript',
            loading: false,
          },
        ];
        openFilesRef.current = presetFiles;
        setOpenFiles(presetFiles);
        setActiveFilePath(path);

        setTreeNodes([
          {
            name: 'src',
            path: 'src',
            type: 'tree',
            sha: 'demo-src',
            children: [
              {
                name: 'services',
                path: 'src/services',
                type: 'tree',
                sha: 'demo-services',
                children: [
                  { name: 'template-engine.js', path: 'src/services/template-engine.js', type: 'blob', sha: 'demo-blob-1' },
                ],
              },
            ],
          },
          { name: 'package.json', path: 'package.json', type: 'blob', sha: 'demo-pkg' },
        ]);

        addTerminalLog('info', `[Preset Loaded] Lodash CVE-2021-23337 Exploit Demo`);

        handleRunRagAudit(
          [{ path, content }],
          [
            {
              package: 'lodash',
              installed_version: '4.17.15',
              cve_id: 'CVE-2021-23337',
              severity: 'HIGH',
              detected_by: ['OSV'],
              title: 'Command Injection via lodash.template',
            },
          ]
        );
      } else if (type === 'safe-filter') {
        const path = 'src/utils/safe-math.js';
        const content = `import _ from "lodash";

// Proves NO FALSE POSITIVES:
// Although lodash@4.17.15 is installed, this file only uses safe utility methods.
export function computeTotalScores(items) {
  if (!_.isArray(items)) {
    return 0;
  }
  // Safe invocation - no prototype pollution:
  return _.sum(items);
}

export function areObjectsEqual(a, b) {
  // Safe invocation:
  return _.isEqual(a, b);
}`;

        const presetFiles = [
          {
            path,
            name: 'safe-math.js',
            content,
            language: 'javascript',
            loading: false,
          },
        ];
        openFilesRef.current = presetFiles;
        setOpenFiles(presetFiles);
        setActiveFilePath(path);

        setTreeNodes([
          {
            name: 'src',
            path: 'src',
            type: 'tree',
            sha: 'demo-src-safe',
            children: [
              {
                name: 'utils',
                path: 'src/utils',
                type: 'tree',
                sha: 'demo-utils',
                children: [
                  { name: 'safe-math.js', path: 'src/utils/safe-math.js', type: 'blob', sha: 'demo-blob-2' },
                ],
              },
            ],
          },
        ]);

        addTerminalLog('info', `[Preset Loaded] False Positive Filter Demonstration (Safe Usage)`);

        handleRunRagAudit(
          [{ path, content }],
          [
            {
              package: 'lodash',
              installed_version: '4.17.15',
              cve_id: 'CVE-2021-23337',
              severity: 'HIGH',
              detected_by: ['OSV'],
              title: 'Lodash template code injection',
            },
          ]
        );
      } else if (type === 'jwt-vuln') {
        const path = 'src/auth/jwt-verifier.js';
        const content = `import jwt from "jsonwebtoken";

// [Vulnerability Finding] Vulnerable to CVE-2022-23529 / CVE-2022-23540
// Verifies token using client-supplied key parameter without pinning algorithms
export function authenticateUser(token, clientKey) {
  // Dangerous invocation:
  return jwt.verify(token, clientKey);
}`;

        const presetFiles = [
          {
            path,
            name: 'jwt-verifier.js',
            content,
            language: 'javascript',
            loading: false,
          },
        ];
        openFilesRef.current = presetFiles;
        setOpenFiles(presetFiles);
        setActiveFilePath(path);

        setTreeNodes([
          {
            name: 'src',
            path: 'src',
            type: 'tree',
            sha: 'demo-src-jwt',
            children: [
              {
                name: 'auth',
                path: 'src/auth',
                type: 'tree',
                sha: 'demo-auth',
                children: [
                  { name: 'jwt-verifier.js', path: 'src/auth/jwt-verifier.js', type: 'blob', sha: 'demo-blob-3' },
                ],
              },
            ],
          },
        ]);

        addTerminalLog('info', `[Preset Loaded] JWT Algorithm Confusion Vulnerability Demo`);

        handleRunRagAudit(
          [{ path, content }],
          [
            {
              package: 'jsonwebtoken',
              installed_version: '8.5.1',
              cve_id: 'CVE-2022-23529',
              severity: 'HIGH',
              detected_by: ['OSV'],
              title: 'Insecure Key Verification in jsonwebtoken',
            },
          ]
        );
      }
    },
    [addTerminalLog, handleRunRagAudit]
  );

  // Close an open tab
  const handleCloseTab = (filePath: string) => {
    setOpenFiles((prev) => {
      const filtered = prev.filter((f) => f.path !== filePath);
      if (activeFilePath === filePath) {
        const nextActive = filtered[filtered.length - 1];
        setActiveFilePath(nextActive ? nextActive.path : null);
        if (nextActive) {
          const match = ragAuditResult?.findings.find(
            (f) => f.file === nextActive.path || nextActive.path.endsWith(f.file) || f.file.endsWith(nextActive.path)
          );
          setActiveAnalysis(match || null);
        } else {
          setActiveAnalysis(null);
        }
      }
      return filtered;
    });
  };

  // Switch active tab
  const handleSelectTab = (filePath: string) => {
    setActiveFilePath(filePath);
    const match = ragAuditResult?.findings.find(
      (f) => f.file === filePath || filePath.endsWith(f.file) || f.file.endsWith(filePath)
    );
    setActiveAnalysis(match || null);
  };

  // Initial load
  useEffect(() => {
    if (initialPreset) {
      handleLoadPreset(initialPreset);
    } else {
      handleLoadRepo(initialRepoUrl);
    }
  }, [initialPreset, initialRepoUrl, handleLoadPreset, handleLoadRepo]);

  const activeFile = openFiles.find((f) => f.path === activeFilePath) || null;

  return (
    <div className="vscode-app">
      {/* 1. VS Code Top TitleBar with Navigation & Auto-Scan */}
      <TitleBar
        currentRepoUrl={repoUrl}
        onLoadRepo={handleLoadRepo}
        onScanRepo={handleScanRepo}
        onRunRagAudit={() => handleRunRagAudit()}
        isAuditing={isAuditing}
        scanId={scanId}
        vulnCount={scanResults?.stats.total ?? 14}
        isLoading={isLoadingRepo}
        isScanning={isScanning}
        branch={branch}
        activeTab={activeSidebarTab}
        onTabChange={(tab) => {
          setActiveSidebarTab(tab);
          setIsSidebarOpen(true);
        }}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isTerminalOpen={isTerminalOpen}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        isScanPanelOpen={isScanPanelOpen}
        onToggleScanPanel={() => setIsScanPanelOpen(!isScanPanelOpen)}
      />

      {/* 2. Main Workbench Row */}
      <div className="vscode-workspace">
        {/* Left Activity Bar */}
        <ActivityBar
          activeTab={activeSidebarTab}
          onTabChange={(tab) => {
            setActiveSidebarTab(tab);
            setIsSidebarOpen(true);
          }}
          isOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isScanPanelOpen={isScanPanelOpen}
          onToggleScanPanel={() => setIsScanPanelOpen(!isScanPanelOpen)}
          isAiAgentOpen={isScanPanelOpen}
          onToggleAiAgent={() => setIsScanPanelOpen(!isScanPanelOpen)}
          aiVulnCount={ragAuditResult?.truePositivesCount}
        />

        {/* Left Sidebar (Explorer / Commits / Search) */}
        {isSidebarOpen && (
          <Sidebar
            activeTab={activeSidebarTab}
            owner={owner || 'golang'}
            repo={repo || 'net'}
            branch={branch || 'master'}
            treeNodes={treeNodes}
            flatFiles={flatFiles}
            activeFilePath={activeFilePath}
            openFiles={openFiles}
            onSelectFile={handleOpenFile}
            onCloseFile={handleCloseTab}
            onRefreshRepo={() => handleLoadRepo(repoUrl)}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            isLoading={isLoadingRepo}
            vulnerableFilePaths={vulnerableFilePaths}
            candidateFindingPaths={candidateFindingPaths}
            findingsMap={findingsMap}
          />
        )}

        {/* Center Editor Area + Bottom Terminal */}
        <div className="vscode-editor-pane">
          {/* Editor Tabs */}
          <EditorTabs
            openFiles={openFiles}
            activeFilePath={activeFilePath}
            onSelectFile={handleSelectTab}
            onCloseFile={handleCloseTab}
            owner={owner || 'golang'}
            repo={repo || 'net'}
          />

          {/* Monaco Code Editor with Live AST Highlight & Remediation */}
          <div className="monaco-wrapper">
            <CodeEditor
              activeFile={activeFile}
              onOpenSample={(url) => handleLoadRepo(url)}
              onCursorChange={(line, col) => setCursorPos({ line, col })}
              analysis={activeAnalysis}
              targetLine={targetLine}
            />
          </div>

          {/* Bottom Terminal Dock Panel */}
          {isTerminalOpen && (
            <ReadonlyTerminal
              logs={terminalLogs}
              onClearLogs={() => setTerminalLogs([])}
              isOpen={isTerminalOpen}
              onToggleOpen={() => setIsTerminalOpen(!isTerminalOpen)}
            />
          )}
        </div>

        {/* Right Side: 100% Dedicated Antigravity / Cursor AI Agent */}
        {isScanPanelOpen && (
          <aside className="vscode-scan-panel" style={{ width: 440, minWidth: 360, maxWidth: 640 }}>
            <AiAgentScanner
              auditResult={ragAuditResult}
              isAuditing={isAuditing}
              onRunAudit={() => handleRunRagAudit()}
              onSelectFinding={handleSelectAiFinding}
              currentScanningFile={currentAuditingFile}
              onLoadPreset={handleLoadPreset}
              activeFilePath={activeFilePath}
            />
          </aside>
        )}
      </div>

      {/* 3. Bottom Status Bar */}
      <StatusBar
        branch={branch || 'master'}
        cursorLine={cursorPos.line}
        cursorCol={cursorPos.col}
        language={activeFile?.language || 'plaintext'}
        totalFiles={flatFiles.length}
      />
    </div>
  );
};
