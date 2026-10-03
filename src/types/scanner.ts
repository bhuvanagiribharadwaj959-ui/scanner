export type VulnerabilitySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export interface VulnerabilityFinding {
  package: string;
  installed_version: string;
  cve_id: string;
  severity: VulnerabilitySeverity;
  detected_by: string[];
  title?: string;
  summary?: string;
  details?: string;
  fixed_version?: string;
  advisory_url?: string;
  published_at?: string;
  aliases?: string[];
  file_path?: string;
  line_number?: number;
  suspect_files?: string[];
}

export interface RawScanReports {
  osv: string;
  trivy: string;
  grype: string;
  union: string;
}

export interface ScanStats {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  unknown: number;
}

export interface ScanResult {
  id: string;
  repoUrl: string;
  owner: string;
  repo: string;
  branch: string;
  timestamp: string; // ISO string
  formattedTime: string;
  durationMs: number;
  stats: ScanStats;
  vulnerabilities: VulnerabilityFinding[];
  reports?: RawScanReports;
}

export interface RagExploitContext {
  cve_id: string;
  package_name: string;
  vulnerable_methods: string[];
  exploit_behavior: string;
  remediation_pattern: string;
  safe_alternative_code?: string;
}

export interface AiFileAnalysis {
  file: string;
  package: string;
  cve_id: string;
  isVulnerable: boolean;
  vulnerableLines: number[];
  importLines: number[];
  reason: string;
  safeAlternative: string;
  inlineSafeAlternative?: string;
  remediationLine?: number;
  ragContextSnippet?: string;
  confidence?: string;
  codeSnippetSent?: string;
  contextTokens?: number;
  modelUsed?: string;
  vulnerableCodeSnippet?: string;
}

export interface RagAuditResult {
  id: string;
  repoUrl: string;
  totalRepoFiles: number;
  candidateFilesCount: number;
  auditedFilesCount: number;
  tokensSavedPercentage: number;
  truePositivesCount: number;
  falsePositivesCount: number;
  findings: AiFileAnalysis[];
  status: 'idle' | 'running' | 'completed' | 'error';
  currentScanningFile?: string;
  modelUsed: string;
  durationMs: number;
}

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  stage: 'OSV_SCAN' | 'RAG_RETRIEVE' | 'GEMINI_AST' | 'MONACO_ANNOTATE';
  message: string;
  file?: string;
  type: 'info' | 'warning' | 'vuln' | 'safe' | 'success';
}
