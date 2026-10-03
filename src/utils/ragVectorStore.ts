import fs from 'fs';
import path from 'path';

export interface VulnerabilityRecord {
  cve_id: string;
  package_name: string;
  ecosystem?: string;
  vulnerable_versions?: string;
  fixed_version?: string;
  severity?: string;
  vulnerable_methods: string[];
  exploit_behavior: string;
  exploit_code_pattern?: string;
  remediation_pattern: string;
  safe_alternative_code: string;
}

export interface RagQueryResult {
  record: VulnerabilityRecord;
  score: number;
  formattedContext: string;
}

// In-memory cache of vector records
let cachedRecords: VulnerabilityRecord[] | null = null;

export function loadVulnerabilityDatabase(): VulnerabilityRecord[] {
  if (cachedRecords) {
    return cachedRecords;
  }

  const candidatePaths = [
    path.join(process.cwd(), 'vulnerability_vector_db', 'vulnerabilities.json'),
    path.join(__dirname, '..', '..', 'vulnerability_vector_db', 'vulnerabilities.json'),
    '/home/blaze/Documents/projects/scanner/vulnerability_vector_db/vulnerabilities.json',
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        cachedRecords = JSON.parse(raw);
        return cachedRecords || [];
      }
    } catch {
      // Continue search
    }
  }

  return [];
}

/**
 * Tokenize a text string into normalized terms for keyword vector similarity
 */
function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

/**
 * Query ChromaDB / Local Vector Store for Exploit Context
 * Queries for: "${cve_id} ${package_name} exploit code pattern"
 */
export async function queryVulnerabilityContext(
  queryText: string,
  packageName?: string,
  cveId?: string
): Promise<RagQueryResult | null> {
  const records = loadVulnerabilityDatabase();
  if (records.length === 0) return null;

  // 1. Direct exact match on CVE ID or package
  if (cveId) {
    const normCve = cveId.toUpperCase().trim();
    const exactMatch = records.find(
      (r) => r.cve_id.toUpperCase() === normCve || (r.cve_id.includes(normCve) && (!packageName || r.package_name.toLowerCase() === packageName.toLowerCase()))
    );
    if (exactMatch) {
      return {
        record: exactMatch,
        score: 1.0,
        formattedContext: formatRagContext(exactMatch),
      };
    }
  }

  // 2. Exact match on package name
  if (packageName) {
    const normPkg = packageName.toLowerCase().trim();
    const pkgMatches = records.filter((r) => r.package_name.toLowerCase() === normPkg);
    if (pkgMatches.length === 1) {
      return {
        record: pkgMatches[0],
        score: 0.95,
        formattedContext: formatRagContext(pkgMatches[0]),
      };
    } else if (pkgMatches.length > 1 && cveId) {
      const best = pkgMatches.find((r) => r.cve_id.toUpperCase().includes(cveId.toUpperCase()));
      if (best) {
        return {
          record: best,
          score: 0.98,
          formattedContext: formatRagContext(best),
        };
      }
    }
  }

  // 3. Semantic / Vector Keyword similarity search
  const queryTokens = new Set(tokenize(`${queryText} ${packageName || ''} ${cveId || ''}`));
  let bestRecord: VulnerabilityRecord | null = null;
  let bestScore = -1;

  for (const record of records) {
    const docText = [
      record.cve_id,
      record.package_name,
      ...record.vulnerable_methods,
      record.exploit_behavior,
      record.exploit_code_pattern || '',
      record.remediation_pattern,
    ].join(' ');

    const docTokens = tokenize(docText);
    let matches = 0;
    for (const t of docTokens) {
      if (queryTokens.has(t)) {
        matches++;
      }
    }

    // Normalized token overlap score
    const score = matches / Math.max(queryTokens.size, 1);

    if (score > bestScore) {
      bestScore = score;
      bestRecord = record;
    }
  }

  if (bestRecord && bestScore > 0.1) {
    return {
      record: bestRecord,
      score: bestScore,
      formattedContext: formatRagContext(bestRecord),
    };
  }

  // Fallback to first matching package or first record
  const fallback = packageName
    ? records.find((r) => r.package_name.toLowerCase().includes(packageName.toLowerCase()))
    : records[0];

  if (fallback) {
    return {
      record: fallback,
      score: 0.5,
      formattedContext: formatRagContext(fallback),
    };
  }

  return null;
}

/**
 * Format document into rich RAG context for Gemini Prompt
 */
export function formatRagContext(record: VulnerabilityRecord): string {
  return `=== VULNERABILITY CONTEXT (RAG VECTOR DB) ===
CVE ID: ${record.cve_id}
Package Name: ${record.package_name} (Fixed Version: ${record.fixed_version || 'Latest'})
Severity: ${record.severity || 'HIGH'}
Vulnerable Function Calls / AST Methods: ${record.vulnerable_methods.join(', ')}
Exploit Behavior: ${record.exploit_behavior}
Vulnerable Code Pattern: ${record.exploit_code_pattern || 'Dynamic invocation with unescaped input'}
Remediation Pattern: ${record.remediation_pattern}
Safe Alternative Snippet:
${record.safe_alternative_code}
==============================================`;
}
