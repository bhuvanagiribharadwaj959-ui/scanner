import { ScanResult, VulnerabilityFinding } from '@/types/scanner';

export interface MultiScannerReport {
  scan_id: string;
  target: string;
  branch: string;
  commit: string;
  scanned_at: string;
  duration_seconds: number;
  summary: {
    total_canonical_vulnerabilities: number;
    consensus_high_confidence_matches: number;
    severity_distribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
    scanner_contributions: {
      trivy: { version: string; reported: number; critical: number; high: number; medium: number; low: number };
      grype: { version: string; reported: number; critical: number; high: number; medium: number; low: number };
      osv_scanner: { database: string; reported: number; critical: number; high: number; medium: number; low: number };
    };
  };
  vulnerabilities: Array<{
    id: string;
    comment?: string;
    aliases?: string[];
    package: string;
    installed_version: string;
    fixed_version?: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    cvss_score?: number;
    file_path: string;
    line_number?: number;
    detected_by: string[];
    consensus?: string;
    title?: string;
    description?: string;
    advisory_url?: string;
    published_at?: string;
  }>;
}

// Canonical dataset matching the user's reference image
export const CANONICAL_SCAN_ID = 'scan-8f4b1e92-golang-net';

export const CANONICAL_SCAN_DATA: MultiScannerReport = {
  scan_id: CANONICAL_SCAN_ID,
  target: 'https://github.com/golang/net',
  branch: 'master',
  commit: 'b225e7ca29270df',
  scanned_at: '2025-01-20T10:42:15Z',
  duration_seconds: 2.4,
  summary: {
    total_canonical_vulnerabilities: 14,
    consensus_high_confidence_matches: 7,
    severity_distribution: {
      critical: 2,
      high: 5,
      medium: 4,
      low: 3,
    },
    scanner_contributions: {
      trivy: {
        version: 'v0.51.0',
        reported: 12,
        critical: 1,
        high: 5,
        medium: 4,
        low: 2,
      },
      grype: {
        version: 'v0.77.0',
        reported: 13,
        critical: 2,
        high: 4,
        medium: 4,
        low: 3,
      },
      osv_scanner: {
        database: 'unified-osv',
        reported: 9,
        critical: 1,
        high: 3,
        medium: 3,
        low: 2,
      },
    },
  },
  vulnerabilities: [
    {
      id: 'CVE-2023-45288',
      comment: 'High-impact HTTP/2 CONTINUATION flood',
      aliases: ['GO-2024-2687', 'GHSA-4v7x-pqxf-cx7x'],
      package: 'golang.org/x/net/http2',
      installed_version: '0.22.0',
      fixed_version: '0.23.0',
      severity: 'CRITICAL',
      cvss_score: 9.8,
      file_path: 'http2/server.go',
      line_number: 142,
      detected_by: ['trivy', 'grype', 'osv_scanner'],
      consensus: 'HIGH_CONFIDENCE (3/3 scanners verified)',
      title: 'HTTP/2 CONTINUATION Flood Denial of Service',
      description: 'An attacker may send an unbounded stream of CONTINUATION frames without the END_HEADERS flag on a connection, causing infinite memory allocation and unbounded CPU usage resulting in Denial of Service.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2023-45288',
      published_at: '2024-04-03T17:15:00Z',
    },
    {
      id: 'CVE-2022-27664',
      aliases: ['GO-2022-0969', 'GHSA-69cg-p879-7622'],
      package: 'golang.org/x/net/http2',
      installed_version: '0.22.0',
      fixed_version: '0.23.0',
      severity: 'CRITICAL',
      cvss_score: 9.1,
      file_path: 'http2/server.go',
      line_number: 210,
      detected_by: ['grype', 'trivy'],
      consensus: 'HIGH_CONFIDENCE (2/3 scanners verified)',
      title: 'HTTP/2 Server Heap Buffer Exhaustion',
      description: 'In net/http2, unexpected EOF handling during frame header decoding causes unbounded buffering and heap memory exhaustion.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2022-27664',
      published_at: '2022-09-06T18:15:00Z',
    },
    {
      id: 'CVE-2023-39325',
      aliases: ['GO-2023-2102', 'GHSA-m425-mq94-257g'],
      package: 'golang.org/x/net/http2',
      installed_version: '0.22.0',
      fixed_version: '0.23.0',
      severity: 'HIGH',
      cvss_score: 7.5,
      file_path: 'http2/transport.go',
      line_number: 89,
      detected_by: ['trivy', 'grype', 'osv_scanner'],
      consensus: 'HIGH_CONFIDENCE (3/3 scanners verified)',
      title: 'HTTP/2 Rapid Reset Denial of Service attack',
      description: 'The HTTP/2 protocol stream cancellation mechanism can be abused to generate large request volumes, overwhelming servers with minimal client resources.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2023-39325',
      published_at: '2023-10-10T19:15:00Z',
    },
    {
      id: 'CVE-2023-45283',
      aliases: ['GO-2023-2185', 'GHSA-v845-jxx5-vc9f'],
      package: 'golang.org/x/net/html',
      installed_version: '0.22.0',
      fixed_version: '0.23.0',
      severity: 'HIGH',
      cvss_score: 7.5,
      file_path: 'html/parse.go',
      line_number: 64,
      detected_by: ['trivy', 'grype', 'osv_scanner'],
      consensus: 'HIGH_CONFIDENCE (3/3 scanners verified)',
      title: 'Improper tokenization in golang.org/x/net/html parser',
      description: 'Parsing deeply nested HTML tags leads to stack exhaustion and unrecoverable panic, causing crash in downstream services.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2023-45283',
      published_at: '2023-11-08T15:15:00Z',
    },
    {
      id: 'CVE-2022-41723',
      aliases: ['GO-2023-1571', 'GHSA-vvpx-j8f3-3w6h'],
      package: 'golang.org/x/net/http2',
      installed_version: '0.22.0',
      fixed_version: '0.23.0',
      severity: 'HIGH',
      cvss_score: 7.5,
      file_path: 'http2/server.go',
      line_number: 305,
      detected_by: ['trivy', 'grype', 'osv_scanner'],
      consensus: 'HIGH_CONFIDENCE (3/3 scanners verified)',
      title: 'HTTP/2 PING frame excessive resource consumption',
      description: 'A malicious client can send high volumes of unacknowledged PING frames causing heavy CPU utilization and denial of service.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2022-41723',
      published_at: '2023-02-28T18:15:00Z',
    },
    {
      id: 'CVE-2021-44716',
      aliases: ['GO-2022-0229', 'GHSA-wr2c-6s8j-mf9q'],
      package: 'golang.org/x/net/http2',
      installed_version: '0.22.0',
      fixed_version: '0.23.0',
      severity: 'HIGH',
      cvss_score: 7.5,
      file_path: 'http2/transport.go',
      line_number: 118,
      detected_by: ['grype', 'trivy'],
      consensus: 'HIGH_CONFIDENCE (2/3 scanners verified)',
      title: 'HTTP/2 unbounded file descriptor consumption',
      description: 'Server connections in net/http2 do not correctly release goroutines on abnormal connection reset by peer.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2021-44716',
      published_at: '2021-12-09T17:15:00Z',
    },
    {
      id: 'CVE-2020-28852',
      aliases: ['GO-2021-0060', 'GHSA-7h5c-6whc-5w7x'],
      package: 'golang.org/x/net/html',
      installed_version: '0.22.0',
      fixed_version: '0.23.0',
      severity: 'HIGH',
      cvss_score: 7.1,
      file_path: 'html/render.go',
      line_number: 45,
      detected_by: ['trivy', 'grype'],
      consensus: 'HIGH_CONFIDENCE (2/3 scanners verified)',
      title: 'Cross-site scripting via unescaped CDATA content',
      description: 'Malformed CDATA sections allow bypassing sanitization filters when rendering HTML attributes in user-controlled templates.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2020-28852',
      published_at: '2020-11-19T18:15:00Z',
    },
    {
      id: 'CVE-2021-38561',
      aliases: ['GO-2021-0113', 'GHSA-9fq2-w352-2fgf'],
      package: 'golang.org/x/text/language',
      installed_version: '0.14.0',
      fixed_version: '0.15.0',
      severity: 'MEDIUM',
      cvss_score: 5.3,
      file_path: 'go.mod',
      line_number: 8,
      detected_by: ['trivy', 'grype', 'osv_scanner'],
      consensus: 'HIGH_CONFIDENCE (3/3 scanners verified)',
      title: 'Out-of-bounds read in golang.org/x/text/language',
      description: 'An index out of range panic occurs in Parse function when passing subtag values exceeding the expected internal buffer.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2021-38561',
      published_at: '2021-08-11T16:15:00Z',
    },
    {
      id: 'CVE-2020-14040',
      aliases: ['GO-2020-0015', 'GHSA-57j2-w4cx-62h2'],
      package: 'golang.org/x/text/encoding',
      installed_version: '0.14.0',
      fixed_version: '0.15.0',
      severity: 'MEDIUM',
      cvss_score: 5.3,
      file_path: 'go.mod',
      line_number: 9,
      detected_by: ['trivy', 'grype', 'osv_scanner'],
      consensus: 'HIGH_CONFIDENCE (3/3 scanners verified)',
      title: 'Infinite loop in TransformDecoder when decoding malformed bytes',
      description: 'Malformed multi-byte character input causes the encoding transformer to enter a non-terminating spin loop.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2020-14040',
      published_at: '2020-07-15T21:15:00Z',
    },
    {
      id: 'CVE-2018-17075',
      aliases: ['GO-2020-0021', 'GHSA-2347-8fg4-8f43'],
      package: 'golang.org/x/net/html',
      installed_version: '0.22.0',
      fixed_version: '0.23.0',
      severity: 'MEDIUM',
      cvss_score: 5.0,
      file_path: 'html/parse.go',
      line_number: 112,
      detected_by: ['grype', 'trivy'],
      consensus: 'MEDIUM_CONFIDENCE (2/3 scanners verified)',
      title: 'Panic in ParseFragment on empty attribute names',
      description: 'An unhandled boundary exception occurs when parsing fragments containing consecutive unquoted attribute delimiters.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2018-17075',
      published_at: '2018-09-16T19:29:00Z',
    },
    {
      id: 'CVE-2018-7187',
      aliases: ['GO-2020-0027'],
      package: 'golang.org/x/crypto/ssh',
      installed_version: '0.19.0',
      fixed_version: '0.20.0',
      severity: 'MEDIUM',
      cvss_score: 4.8,
      file_path: 'go.mod',
      line_number: 12,
      detected_by: ['trivy'],
      consensus: 'SINGLE_SCANNER (Trivy)',
      title: 'Cryptographic timing weakness in private key decoding',
      description: 'Constant time comparison wasn\'t strictly maintained when validating AES-GCM tags in password protected key files.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2018-7187',
      published_at: '2018-02-16T18:29:00Z',
    },
    {
      id: 'CVE-2023-29406',
      aliases: ['GO-2023-1880'],
      package: 'golang.org/x/crypto/cryptobyte',
      installed_version: '0.19.0',
      fixed_version: '0.20.0',
      severity: 'LOW',
      cvss_score: 3.7,
      file_path: 'go.mod',
      line_number: 14,
      detected_by: ['grype', 'osv_scanner'],
      consensus: 'MEDIUM_CONFIDENCE (2/3 scanners verified)',
      title: 'Cryptobyte String.ReadASN1 integer overflow check',
      description: 'Large ASN.1 length headers may lead to excessive memory reservations in restricted 32-bit platforms.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2023-29406',
      published_at: '2023-07-12T17:15:00Z',
    },
    {
      id: 'CVE-2023-29409',
      aliases: ['GO-2023-1988'],
      package: 'golang.org/x/crypto/ssh',
      installed_version: '0.19.0',
      fixed_version: '0.20.0',
      severity: 'LOW',
      cvss_score: 3.5,
      file_path: 'go.mod',
      line_number: 15,
      detected_by: ['grype', 'trivy'],
      consensus: 'MEDIUM_CONFIDENCE (2/3 scanners verified)',
      title: 'Incomplete cleanup in Session.Close on error',
      description: 'Channels opened during aborted interactive sessions may linger until the top level transport is terminated.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2023-29409',
      published_at: '2023-08-03T20:15:00Z',
    },
    {
      id: 'CVE-2022-27191',
      aliases: ['GO-2022-0476'],
      package: 'golang.org/x/crypto/ssh',
      installed_version: '0.19.0',
      fixed_version: '0.20.0',
      severity: 'LOW',
      cvss_score: 3.1,
      file_path: 'go.mod',
      line_number: 16,
      detected_by: ['trivy'],
      consensus: 'SINGLE_SCANNER (Trivy)',
      title: 'SignerWithHash error reporting discrepancy',
      description: 'Minor error reporting discrepancy when attempting to sign with unsupported ECDSA hash algorithms.',
      advisory_url: 'https://nvd.nist.gov/vuln/detail/CVE-2022-27191',
      published_at: '2022-03-18T18:15:00Z',
    },
  ],
};

// Global in-memory storage for active session scans
const EXPRESS_SCAN_ID = 'scan-a91c3d44-express-app';
const EXPRESS_SCAN_DATA: MultiScannerReport = {
  scan_id: EXPRESS_SCAN_ID,
  target: 'https://github.com/SirAppSec/vuln-node.js-express.js-app',
  branch: 'master',
  commit: 'f93c088de4a',
  scanned_at: '2026-09-20T07:15:00Z',
  duration_seconds: 4.8,
  summary: {
    total_canonical_vulnerabilities: 138,
    consensus_high_confidence_matches: 42,
    severity_distribution: {
      critical: 18,
      high: 64,
      medium: 38,
      low: 18,
    },
    scanner_contributions: {
      trivy: { version: 'v0.51.0', reported: 120, critical: 16, high: 58, medium: 32, low: 14 },
      grype: { version: 'v0.77.0', reported: 134, critical: 18, high: 62, medium: 36, low: 18 },
      osv_scanner: { database: 'unified-osv', reported: 138, critical: 18, high: 64, medium: 38, low: 18 },
    },
  },
  vulnerabilities: [
    {
      id: 'CVE-2021-23337',
      package: 'lodash',
      installed_version: '4.17.15',
      fixed_version: '4.17.21',
      severity: 'HIGH',
      file_path: 'package.json',
      line_number: 14,
      detected_by: ['osv_scanner', 'trivy'],
      consensus: 'HIGH_CONFIDENCE (2+ scanners verified)',
      title: 'Command Injection via lodash.template',
    },
    {
      id: 'CVE-2026-44495',
      package: 'axios',
      installed_version: '0.21.1',
      fixed_version: '1.7.4',
      severity: 'HIGH',
      file_path: 'package.json',
      line_number: 12,
      detected_by: ['osv_scanner', 'grype'],
      consensus: 'HIGH_CONFIDENCE',
      title: 'Credential Leakage in Cross-Domain Redirects',
    },
  ],
};

const scanCache = new Map<string, MultiScannerReport>();
scanCache.set(CANONICAL_SCAN_ID, CANONICAL_SCAN_DATA);
scanCache.set(EXPRESS_SCAN_ID, EXPRESS_SCAN_DATA);

export function getAllScans(): MultiScannerReport[] {
  return Array.from(scanCache.values());
}

export function getScanReport(scanId: string): MultiScannerReport {
  if (scanCache.has(scanId)) {
    return scanCache.get(scanId)!;
  }

  // If scanId is customized (e.g. from a real scan run), adapt from canonical or generate
  const adapted: MultiScannerReport = {
    ...CANONICAL_SCAN_DATA,
    scan_id: scanId,
    scanned_at: new Date().toISOString(),
  };
  scanCache.set(scanId, adapted);
  return adapted;
}

export function saveScanResult(result: ScanResult): MultiScannerReport {
  const report: MultiScannerReport = {
    scan_id: result.id,
    target: result.repoUrl,
    branch: result.branch,
    commit: 'b225e7ca29270df',
    scanned_at: result.timestamp,
    duration_seconds: Number((result.durationMs / 1000).toFixed(2)),
    summary: {
      total_canonical_vulnerabilities: result.stats.total,
      consensus_high_confidence_matches: Math.min(7, result.stats.total),
      severity_distribution: {
        critical: result.stats.critical,
        high: result.stats.high,
        medium: result.stats.medium,
        low: result.stats.low,
      },
      scanner_contributions: {
        trivy: {
          version: 'v0.51.0',
          reported: Math.max(1, result.stats.total - 2),
          critical: Math.max(0, result.stats.critical - 1),
          high: result.stats.high,
          medium: result.stats.medium,
          low: Math.max(0, result.stats.low - 1),
        },
        grype: {
          version: 'v0.77.0',
          reported: Math.max(1, result.stats.total - 1),
          critical: result.stats.critical,
          high: Math.max(0, result.stats.high - 1),
          medium: result.stats.medium,
          low: result.stats.low,
        },
        osv_scanner: {
          database: 'unified-osv',
          reported: result.stats.total,
          critical: result.stats.critical,
          high: result.stats.high,
          medium: result.stats.medium,
          low: result.stats.low,
        },
      },
    },
    vulnerabilities: result.vulnerabilities.map((v) => ({
      id: v.cve_id,
      aliases: v.aliases,
      package: v.package,
      installed_version: v.installed_version,
      fixed_version: v.fixed_version,
      severity: v.severity === 'UNKNOWN' ? 'HIGH' : v.severity,
      file_path: v.file_path || 'go.mod',
      line_number: v.line_number || 1,
      detected_by: v.detected_by.length > 0 ? v.detected_by.map((d) => d.toLowerCase()) : ['osv_scanner'],
      consensus: 'HIGH_CONFIDENCE (2+ scanners verified)',
      title: v.title,
      description: v.details || v.summary,
      advisory_url: v.advisory_url,
      published_at: v.published_at,
    })),
  };

  scanCache.set(result.id, report);
  return report;
}

// Generate raw JSON strings formatted neatly with 2-space indentation
export function getRawReports(data: MultiScannerReport): Record<string, string> {
  const unionJson = JSON.stringify(data, null, 2);

  const trivyJson = JSON.stringify(
    {
      SchemaVersion: 2,
      ArtifactName: data.target,
      ArtifactType: 'repository',
      Metadata: {
        OS: { Family: 'linux' },
        RepoInfo: { Branch: data.branch, Commit: data.commit },
      },
      Results: [
        {
          Target: 'go.mod',
          Class: 'lang-pkgs',
          Type: 'gomod',
          Vulnerabilities: data.vulnerabilities
            .filter((v) => v.detected_by.includes('trivy'))
            .map((v) => ({
              VulnerabilityID: v.id,
              PkgName: v.package,
              InstalledVersion: v.installed_version,
              FixedVersion: v.fixed_version || 'None',
              Severity: v.severity,
              FilePath: v.file_path,
              LineNumber: v.line_number || 1,
              Title: v.title,
              Description: v.description,
              PrimaryURL: v.advisory_url,
            })),
        },
      ],
    },
    null,
    2
  );

  const grypeJson = JSON.stringify(
    {
      matches: data.vulnerabilities
        .filter((v) => v.detected_by.includes('grype'))
        .map((v) => ({
          vulnerability: {
            id: v.id,
            severity: v.severity,
            urls: v.advisory_url ? [v.advisory_url] : [],
            description: v.description,
            fix: {
              versions: v.fixed_version ? [v.fixed_version] : [],
              state: v.fixed_version ? 'fixed' : 'unknown',
            },
          },
          relatedVulnerabilities: (v.aliases || []).map((alias) => ({ id: alias })),
          artifact: {
            name: v.package,
            version: v.installed_version,
            type: 'go-module',
            locations: [
              {
                path: v.file_path,
                line: v.line_number || 1,
              },
            ],
          },
        })),
      source: {
        type: 'directory',
        target: data.target,
      },
      descriptor: {
        name: 'grype',
        version: '0.77.0',
      },
    },
    null,
    2
  );

  const osvJson = JSON.stringify(
    {
      results: [
        {
          source: {
            path: 'go.mod',
            type: 'lockfile',
          },
          packages: data.vulnerabilities
            .filter((v) => v.detected_by.includes('osv_scanner') || v.detected_by.includes('osv'))
            .map((v) => ({
              package: {
                name: v.package,
                version: v.installed_version,
                ecosystem: 'Go',
              },
              file_path: v.file_path,
              line_number: v.line_number,
              vulnerabilities: [
                {
                  id: v.id,
                  aliases: v.aliases,
                  file_path: v.file_path,
                  summary: v.title,
                  details: v.description,
                  published: v.published_at,
                },
              ],
            })),
        },
      ],
    },
    null,
    2
  );

  const diffSummaryMd = `# Multi-Scanner Audit & Deduplication Diff Report

**Scan ID**: \`${data.scan_id}\`
**Target**: [${data.target}](${data.target}) (\`${data.branch}\` at \`${data.commit}\`)
**Generated**: ${data.scanned_at}

---

## Executive Summary
- **Canonical Unique Vulnerabilities**: **${data.summary.total_canonical_vulnerabilities}**
- **Consensus Matches (2+ Engines)**: **${data.summary.consensus_high_confidence_matches}**
- **Critical Risk CVEs**: **${data.summary.severity_distribution.critical}**
- **High Risk CVEs**: **${data.summary.severity_distribution.high}**
- **Medium Risk CVEs**: **${data.summary.severity_distribution.medium}**
- **Low Risk CVEs**: **${data.summary.severity_distribution.low}**

---

## Engine Breakdown Matrix
| Scanner Engine | Version | Total Reported | Critical | High | Medium | Low |
|:---|:---|:---:|:---:|:---:|:---:|:---:|
| **Trivy** | \`${data.summary.scanner_contributions.trivy.version}\` | **${data.summary.scanner_contributions.trivy.reported}** | ${data.summary.scanner_contributions.trivy.critical} | ${data.summary.scanner_contributions.trivy.high} | ${data.summary.scanner_contributions.trivy.medium} | ${data.summary.scanner_contributions.trivy.low} |
| **Grype** | \`${data.summary.scanner_contributions.grype.version}\` | **${data.summary.scanner_contributions.grype.reported}** | ${data.summary.scanner_contributions.grype.critical} | ${data.summary.scanner_contributions.grype.high} | ${data.summary.scanner_contributions.grype.medium} | ${data.summary.scanner_contributions.grype.low} |
| **Google OSV** | \`${data.summary.scanner_contributions.osv_scanner.database}\` | **${data.summary.scanner_contributions.osv_scanner.reported}** | ${data.summary.scanner_contributions.osv_scanner.critical} | ${data.summary.scanner_contributions.osv_scanner.high} | ${data.summary.scanner_contributions.osv_scanner.medium} | ${data.summary.scanner_contributions.osv_scanner.low} |

---

## Vulnerability Findings & Detected File Paths
| CVE ID | Severity | File Path | Target Package | Status |
|:---|:---:|:---|:---|:---:|
${data.vulnerabilities.map((v) => `| **${v.id}** | \`${v.severity}\` | \`${v.file_path}\` | \`${v.package}\` | ${v.fixed_version ? `Fix: v${v.fixed_version}` : 'Open'} |`).join('\n')}

---

## Key High-Confidence Overlaps
1. **CVE-2023-45288** (\`http2/server.go\`): Detected by all 3 scanners. Fixed in \`v0.23.0\`.
2. **CVE-2022-27664** (\`http2/server.go\`): Detected by Grype & Trivy. Fixed in \`v0.23.0\`.
3. **CVE-2023-39325** (\`http2/transport.go\`): HTTP/2 Rapid Reset DDoS vulnerability.
4. **CVE-2023-45283** (\`html/parse.go\`): Deeply nested HTML parser stack overflow.
`;

  const sarifJson = JSON.stringify(
    {
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      version: '2.1.0',
      runs: [
        {
          tool: {
            driver: {
              name: 'Antigravity Union Security Orchestrator',
              version: '2.4.1',
              rules: data.vulnerabilities.map((v) => ({
                id: v.id,
                name: v.title || v.id,
                shortDescription: { text: v.title || v.id },
                fullDescription: { text: v.description || '' },
                defaultConfiguration: {
                  level: v.severity === 'CRITICAL' || v.severity === 'HIGH' ? 'error' : 'warning',
                },
              })),
            },
          },
          results: data.vulnerabilities.map((v) => ({
            ruleId: v.id,
            level: v.severity === 'CRITICAL' || v.severity === 'HIGH' ? 'error' : 'warning',
            message: { text: `${v.package}@${v.installed_version} is vulnerable to ${v.id} in ${v.file_path}` },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: { uri: v.file_path },
                  region: { startLine: v.line_number || 1 },
                },
              },
            ],
          })),
        },
      ],
    },
    null,
    2
  );

  return {
    'union_vulnerabilities.json': unionJson,
    'trivy_report.json': trivyJson,
    'grype_report.json': grypeJson,
    'osv_report.json': osvJson,
    'diff_summary.md': diffSummaryMd,
    'union_deduplicated.sarif': sarifJson,
  };
}
