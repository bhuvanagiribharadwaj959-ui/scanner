import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { VulnerabilityFinding, ScanResult, VulnerabilitySeverity, RawScanReports } from '@/types/scanner';
import { saveScanResult } from '@/utils/scanStore';

const execAsync = promisify(exec);

// Find OSV scanner executable
function getOsvScannerBinary(): string {
  const candidates = [
    '/home/blaze/.local/bin/osv-scanner',
    '/home/blaze/.net-scanner/tools/osv-scanner/v2.3.8/osv-scanner_linux_amd64',
    'osv-scanner',
  ];
  for (const bin of candidates) {
    try {
      if (fs.existsSync(bin)) {
        return bin;
      }
    } catch {
      // Continue to next
    }
  }
  return 'osv-scanner';
}

function normalizeSeverity(rawSeverity?: string, cvssScores?: any[]): VulnerabilitySeverity {
  if (rawSeverity) {
    const upper = rawSeverity.toUpperCase();
    if (upper.includes('CRIT')) return 'CRITICAL';
    if (upper.includes('HIGH')) return 'HIGH';
    if (upper.includes('MED') || upper.includes('MODERATE')) return 'MEDIUM';
    if (upper.includes('LOW')) return 'LOW';
  }

  // Attempt to parse CVSS if available
  if (cvssScores && Array.isArray(cvssScores)) {
    for (const item of cvssScores) {
      const scoreStr = item.score;
      if (typeof scoreStr === 'string') {
        const match = scoreStr.match(/\/S:([0-9.]+)/) || scoreStr.match(/CVSS:[0-9.]+\/.*([0-9]+\.[0-9]+)/);
        if (match) {
          const num = parseFloat(match[1]);
          if (num >= 9.0) return 'CRITICAL';
          if (num >= 7.0) return 'HIGH';
          if (num >= 4.0) return 'MEDIUM';
          if (num > 0) return 'LOW';
        }
      }
    }
  }

  return 'HIGH'; // Standard default in SCA tools when unspecified
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    let repoUrl = body.repoUrl || 'https://github.com/golang/net';
    let owner = body.owner || '';
    let repo = body.repo || '';
    let branch = body.branch || '';
    const forceFresh = Boolean(body.forceFresh);

    // Check if user requested to scan local project
    const isLocal = repoUrl === 'local' || repoUrl === '.' || repoUrl === 'current';
    let targetDir = '';

    if (isLocal) {
      targetDir = process.cwd();
      owner = 'local';
      repo = 'scanner';
      repoUrl = 'Local Codebase (workspace)';
    } else {
      // Normalize GitHub URL
      const urlMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/#?]+)/i);
      if (urlMatch) {
        owner = owner || urlMatch[1];
        repo = (repo || urlMatch[2]).replace(/\.git$/, '');
        repoUrl = `https://github.com/${owner}/${repo}`;
      }

      if (!owner || !repo) {
        // Fallback if URL is just owner/repo
        const parts = repoUrl.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/, '').split('/');
        if (parts.length >= 2) {
          owner = parts[0];
          repo = parts[1];
          repoUrl = `https://github.com/${owner}/${repo}`;
        } else {
          owner = 'golang';
          repo = 'net';
          repoUrl = 'https://github.com/golang/net';
        }
      }

      const cacheBaseDir = path.join('/tmp', 'scanner-cache');
      if (!fs.existsSync(cacheBaseDir)) {
        fs.mkdirSync(cacheBaseDir, { recursive: true });
      }

      targetDir = path.join(cacheBaseDir, `${owner}_${repo}`);

      // Clone or reuse cached shallow repository
      if (!fs.existsSync(targetDir) || forceFresh) {
        if (fs.existsSync(targetDir)) {
          try {
            fs.rmSync(targetDir, { recursive: true, force: true });
          } catch {
            // ignore
          }
        }

        const branchFlag = branch ? `-b ${branch}` : '';
        const cloneCmd = `git clone --depth 1 ${branchFlag} ${repoUrl}.git "${targetDir}"`;
        try {
          await execAsync(cloneCmd, { timeout: 30000 });
        } catch (cloneErr: any) {
          // If specific branch failed, try default clone
          if (branch) {
            await execAsync(`git clone --depth 1 ${repoUrl}.git "${targetDir}"`, { timeout: 30000 });
          } else {
            throw new Error(`Failed to clone repository: ${cloneErr.message}`);
          }
        }
      }
    }

    const osvBin = getOsvScannerBinary();

    // Concurrently execute OSV-Scanner, Trivy, and Grype
    const [osvRes, trivyRes, grypeRes] = await Promise.allSettled([
      // 1. OSV-Scanner
      execAsync(`"${osvBin}" scan source --format json -r "${targetDir}"`, {
        timeout: 45000,
        maxBuffer: 25 * 1024 * 1024,
      }),
      // 2. Trivy
      execAsync(`trivy fs --skip-db-update --format json "${targetDir}"`, {
        timeout: 45000,
        maxBuffer: 25 * 1024 * 1024,
      }),
      // 3. Grype
      execAsync(`GRYPE_DB_VALIDATE_AGE=false GRYPE_DB_AUTO_UPDATE=false grype dir:"${targetDir}" -o json`, {
        timeout: 45000,
        maxBuffer: 25 * 1024 * 1024,
      }),
    ]);

    // Parse OSV JSON
    let osvJson: any = { results: [] };
    if (osvRes.status === 'fulfilled' && osvRes.value.stdout) {
      try {
        osvJson = JSON.parse(osvRes.value.stdout);
      } catch {}
    } else if (osvRes.status === 'rejected') {
      const errOut = (osvRes.reason as any)?.stdout;
      if (errOut && errOut.trim().startsWith('{')) {
        try {
          osvJson = JSON.parse(errOut);
        } catch {}
      }
    }

    // Parse Trivy JSON
    let trivyJson: any = { Results: [] };
    if (trivyRes.status === 'fulfilled' && trivyRes.value.stdout) {
      try {
        trivyJson = JSON.parse(trivyRes.value.stdout);
      } catch {}
    } else if (trivyRes.status === 'rejected') {
      const errOut = (trivyRes.reason as any)?.stdout;
      if (errOut && errOut.trim().startsWith('{')) {
        try {
          trivyJson = JSON.parse(errOut);
        } catch {}
      }
    }

    // Parse Grype JSON
    let grypeJson: any = { matches: [] };
    if (grypeRes.status === 'fulfilled' && grypeRes.value.stdout) {
      try {
        grypeJson = JSON.parse(grypeRes.value.stdout);
      } catch {}
    } else if (grypeRes.status === 'rejected') {
      const errOut = (grypeRes.reason as any)?.stdout;
      if (errOut && errOut.trim().startsWith('{')) {
        try {
          grypeJson = JSON.parse(errOut);
        } catch {}
      }
    }

    // Find all candidate source files in targetDir to detect suspect files
    const suspectFilesByPackage: Record<string, string[]> = {};
    try {
      const findFilesCmd = `find "${targetDir}" -type f \\( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.go" -o -name "*.py" \\) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/build/*" | head -n 250`;
      const { stdout: filesOut } = await execAsync(findFilesCmd, { timeout: 10000 });
      const filesList = filesOut.split('\n').filter(Boolean);

      for (const absFile of filesList) {
        try {
          const content = fs.readFileSync(absFile, 'utf8');
          const relPath = path.relative(targetDir, absFile).replace(/\\/g, '/');

          // Check standard package import patterns
          const matches = [
            ...content.matchAll(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
            ...content.matchAll(/from\s*['"]([^'"]+)['"]/g),
            ...content.matchAll(/import\s*['"]([^'"]+)['"]/g),
            ...content.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
          ];

          for (const m of matches) {
            const rawPkg = m[1].replace(/^\.\.?\//, '').split('/')[0];
            if (rawPkg && !rawPkg.startsWith('.')) {
              if (!suspectFilesByPackage[rawPkg]) suspectFilesByPackage[rawPkg] = [];
              if (!suspectFilesByPackage[rawPkg].includes(relPath)) {
                suspectFilesByPackage[rawPkg].push(relPath);
              }
            }
          }
        } catch {}
      }
    } catch {}

    // Deduplication Map: key = `${pkg_name}@${version}:${cve_id}`
    const vulnerabilitiesMap: Record<string, VulnerabilityFinding> = {};

    // 1. Ingest OSV Findings
    const results = osvJson.results || [];
    for (const result of results) {
      let rawSourcePath = result.source?.path || 'go.mod';
      if (targetDir && rawSourcePath.startsWith(targetDir)) {
        rawSourcePath = rawSourcePath.substring(targetDir.length).replace(/^[/\\]+/, '');
      }
      const baseFilePath = rawSourcePath || 'go.mod';

      const packages = result.packages || [];
      for (const pkgItem of packages) {
        const pkgObj = pkgItem.package || {};
        const pkgName = pkgObj.name || 'unknown';
        const pkgVersion = pkgObj.version || 'unknown';
        const vulns = pkgItem.vulnerabilities || [];

        let filePath = baseFilePath;
        const suspects = suspectFilesByPackage[pkgName] || [];
        if (suspects.length > 0) {
          filePath = suspects[0];
        } else if (pkgName.includes('http2')) {
          filePath = 'http2/server.go';
        } else if (pkgName.includes('html')) {
          filePath = 'html/parse.go';
        } else if (pkgName.includes('bpf')) {
          filePath = 'bpf/setter.go';
        }

        for (const vuln of vulns) {
          const rawId = vuln.id || 'UNKNOWN';
          const aliases: string[] = Array.isArray(vuln.aliases) ? vuln.aliases : [];
          const cveAlias = aliases.find((a) => a.startsWith('CVE-'));
          const cveId = cveAlias || rawId;

          const rawSev =
            vuln.database_specific?.severity ||
            vuln.database_specific?.nvd_severity ||
            vuln.database_specific?.github_reviewed_severity;
          const severity = normalizeSeverity(rawSev, vuln.severity);

          let fixedVersion = '';
          if (Array.isArray(vuln.affected)) {
            for (const aff of vuln.affected) {
              if (Array.isArray(aff.ranges)) {
                for (const r of aff.ranges) {
                  if (Array.isArray(r.events)) {
                    for (const ev of r.events) {
                      if (ev.fixed) {
                        fixedVersion = ev.fixed;
                        break;
                      }
                    }
                  }
                  if (fixedVersion) break;
                }
              }
              if (fixedVersion) break;
            }
          }

          const advisoryUrl =
            vuln.database_specific?.url ||
            (Array.isArray(vuln.references) && vuln.references.find((r: any) => r.type === 'ADVISORY' || r.type === 'REPORT' || r.type === 'WEB')?.url) ||
            `https://osv.dev/vulnerability/${rawId}`;

          const key = `${pkgName}@${pkgVersion}:${cveId}`;

          if (!vulnerabilitiesMap[key]) {
            vulnerabilitiesMap[key] = {
              package: pkgName,
              installed_version: pkgVersion,
              cve_id: cveId,
              severity,
              file_path: filePath,
              suspect_files: suspects.length > 0 ? suspects : [filePath],
              detected_by: ['OSV'],
              title: vuln.summary || `Vulnerability in ${pkgName}`,
              summary: vuln.summary,
              details: vuln.details,
              fixed_version: fixedVersion || undefined,
              advisory_url: advisoryUrl,
              published_at: vuln.published,
              aliases: aliases.length > 0 ? aliases : undefined,
            };
          } else {
            if (!vulnerabilitiesMap[key].detected_by.includes('OSV')) {
              vulnerabilitiesMap[key].detected_by.push('OSV');
            }
          }
        }
      }
    }

    // 2. Ingest Trivy Findings
    if (Array.isArray(trivyJson.Results)) {
      for (const tTarget of trivyJson.Results) {
        const vulns = tTarget.Vulnerabilities || [];
        for (const tv of vulns) {
          const pkgName = tv.PkgName || 'unknown';
          const pkgVersion = tv.InstalledVersion || 'unknown';
          const cveId = tv.VulnerabilityID || 'UNKNOWN';
          const severity = normalizeSeverity(tv.Severity);
          const key = `${pkgName}@${pkgVersion}:${cveId}`;
          const suspects = suspectFilesByPackage[pkgName] || [];
          const filePath = suspects[0] || tTarget.Target || 'package.json';

          if (!vulnerabilitiesMap[key]) {
            vulnerabilitiesMap[key] = {
              package: pkgName,
              installed_version: pkgVersion,
              cve_id: cveId,
              severity,
              file_path: filePath,
              suspect_files: suspects.length > 0 ? suspects : [filePath],
              detected_by: ['Trivy'],
              title: tv.Title || tv.Description || `Vulnerability in ${pkgName}`,
              summary: tv.Title || tv.Description,
              details: tv.Description,
              fixed_version: tv.FixedVersion || undefined,
              advisory_url: tv.PrimaryURL,
            };
          } else {
            if (!vulnerabilitiesMap[key].detected_by.includes('Trivy')) {
              vulnerabilitiesMap[key].detected_by.push('Trivy');
            }
            if (!vulnerabilitiesMap[key].fixed_version && tv.FixedVersion) {
              vulnerabilitiesMap[key].fixed_version = tv.FixedVersion;
            }
          }
        }
      }
    }

    // 3. Ingest Grype Findings
    if (Array.isArray(grypeJson.matches)) {
      for (const gm of grypeJson.matches) {
        const pkgName = gm.artifact?.name || 'unknown';
        const pkgVersion = gm.artifact?.version || 'unknown';
        const cveId = gm.vulnerability?.id || 'UNKNOWN';
        const severity = normalizeSeverity(gm.vulnerability?.severity);
        const key = `${pkgName}@${pkgVersion}:${cveId}`;
        const suspects = suspectFilesByPackage[pkgName] || [];
        const locPath = gm.artifact?.locations?.[0]?.path?.replace(/^\/+/, '') || 'package.json';
        const filePath = suspects[0] || locPath;
        const fixedVersion = gm.vulnerability?.fix?.versions?.[0];

        if (!vulnerabilitiesMap[key]) {
          vulnerabilitiesMap[key] = {
            package: pkgName,
            installed_version: pkgVersion,
            cve_id: cveId,
            severity,
            file_path: filePath,
            suspect_files: suspects.length > 0 ? suspects : [filePath],
            detected_by: ['Grype'],
            title: gm.vulnerability?.description || `Vulnerability in ${pkgName}`,
            summary: gm.vulnerability?.description,
            details: gm.vulnerability?.description,
            fixed_version: fixedVersion || undefined,
            advisory_url: gm.vulnerability?.urls?.[0],
          };
        } else {
          if (!vulnerabilitiesMap[key].detected_by.includes('Grype')) {
            vulnerabilitiesMap[key].detected_by.push('Grype');
          }
          if (!vulnerabilitiesMap[key].fixed_version && fixedVersion) {
            vulnerabilitiesMap[key].fixed_version = fixedVersion;
          }
        }
      }
    }

    const vulnerabilities = Object.values(vulnerabilitiesMap);

    // Compute stats
    const stats = {
      total: vulnerabilities.length,
      critical: vulnerabilities.filter((v) => v.severity === 'CRITICAL').length,
      high: vulnerabilities.filter((v) => v.severity === 'HIGH').length,
      medium: vulnerabilities.filter((v) => v.severity === 'MEDIUM').length,
      low: vulnerabilities.filter((v) => v.severity === 'LOW').length,
      unknown: vulnerabilities.filter((v) => v.severity === 'UNKNOWN').length,
    };

    const durationMs = Date.now() - startTime;
    const now = new Date();
    const formattedTime = now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    // Create the full Union JSON object
    const unionJson = {
      scan_metadata: {
        repository: repoUrl,
        scanners_executed: ['OSV-Scanner v2.3.8', 'Trivy v0.71.2', 'Grype v0.112.0'],
        total_unique_vulnerabilities: vulnerabilities.length,
        scanned_at: now.toISOString(),
        duration_ms: durationMs,
        stats,
      },
      vulnerabilities,
      suspect_files_summary: suspectFilesByPackage,
    };

    // Serialize RAW JSON reports for OSV, Trivy, Grype, and Union
    const reports: RawScanReports = {
      osv: JSON.stringify(osvJson, null, 2),
      trivy: JSON.stringify(trivyJson, null, 2),
      grype: JSON.stringify(grypeJson, null, 2),
      union: JSON.stringify(unionJson, null, 2),
    };

    // Save RAW JSON reports directly into repository current root directory on disk
    if (targetDir && fs.existsSync(targetDir)) {
      try {
        fs.writeFileSync(path.join(targetDir, 'osv-scanner.json'), reports.osv, 'utf-8');
        fs.writeFileSync(path.join(targetDir, 'trivy-report.json'), reports.trivy, 'utf-8');
        fs.writeFileSync(path.join(targetDir, 'grype-report.json'), reports.grype, 'utf-8');
        fs.writeFileSync(path.join(targetDir, 'vulnerabilities-union.json'), reports.union, 'utf-8');
      } catch (writeErr) {
        console.warn('Could not write scan reports to target directory on disk:', writeErr);
      }
    }

    const responseData: ScanResult = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      repoUrl,
      owner,
      repo,
      branch: branch || 'master',
      timestamp: now.toISOString(),
      formattedTime,
      durationMs,
      stats,
      vulnerabilities,
      reports,
    };

    saveScanResult(responseData);

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Internal error while performing OSV scan',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repoUrl = searchParams.get('url') || 'https://github.com/golang/net';
  const branch = searchParams.get('branch') || '';
  const force = searchParams.get('force') === 'true';

  // Delegate to POST handler
  const dummyReq = new NextRequest(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repoUrl, branch, forceFresh: force }),
  });

  return POST(dummyReq);
}
