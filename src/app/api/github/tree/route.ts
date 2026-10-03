import { NextRequest, NextResponse } from 'next/server';
import { buildTreeFromItems } from '@/utils/language';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// In-memory cache: key -> { data, timestamp }
const treeCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getTreeFromLocalCache(owner: string, repo: string, branch: string = 'master') {
  const cacheBaseDir = path.join('/tmp', 'scanner-cache');
  const targetDir = path.join(cacheBaseDir, `${owner}_${repo}`);

  if (!fs.existsSync(targetDir)) return null;

  const rawItems: Array<{ path: string; type: 'blob' | 'tree'; sha: string; size?: number }> = [];

  const walk = (currentDir: string, relBase: string = '') => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.name === '.git' || ent.name === 'node_modules') continue;
      const relPath = relBase ? `${relBase}/${ent.name}` : ent.name;
      const fullPath = path.join(currentDir, ent.name);

      if (ent.isDirectory()) {
        rawItems.push({ path: relPath, type: 'tree', sha: `tree-${relPath}` });
        walk(fullPath, relPath);
      } else if (ent.isFile()) {
        const stat = fs.statSync(fullPath);
        rawItems.push({ path: relPath, type: 'blob', sha: `blob-${relPath}`, size: stat.size });
      }
    }
  };

  walk(targetDir);

  const totalFiles = rawItems.filter((i) => i.type === 'blob').length;
  const totalDirs = rawItems.filter((i) => i.type === 'tree').length;
  const hierarchicalTree = buildTreeFromItems(rawItems);

  return {
    owner,
    repo,
    branch,
    truncated: false,
    totalFiles,
    totalDirs,
    tree: hierarchicalTree,
    flatList: rawItems,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  let branch = searchParams.get('branch');

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'Missing required parameters: owner and repo' },
      { status: 400 }
    );
  }

  const cacheKey = `${owner.toLowerCase()}/${repo.toLowerCase()}/${branch || 'default'}`;
  const cached = treeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'VSCode-Web-Editor-Monaco',
  };

  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    // If branch is not specified, get the repo details first to find default branch
    let defaultBranch = branch || 'main';
    if (!branch) {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (repoRes.ok) {
        const repoData = await repoRes.json();
        defaultBranch = repoData.default_branch || 'main';
        branch = defaultBranch;
      } else {
        // Default to main or master
        branch = 'master';
      }
    }

    // Now fetch git tree recursively
    let treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
      { headers }
    );

    // If fetching with branch failed (e.g. was 'main' but repo default is 'master'), try fallback
    if (!treeRes.ok && (branch === 'main' || branch === 'master')) {
      const altBranch = branch === 'main' ? 'master' : 'main';
      const fallbackRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/trees/${altBranch}?recursive=1`,
        { headers }
      );
      if (fallbackRes.ok) {
        treeRes = fallbackRes;
        branch = altBranch;
      }
    }

    if (treeRes.ok) {
      const treeData = await treeRes.json();
      const rawItems = treeData.tree || [];

      const totalFiles = rawItems.filter((i: any) => i.type === 'blob').length;
      const totalDirs = rawItems.filter((i: any) => i.type === 'tree').length;
      const hierarchicalTree = buildTreeFromItems(rawItems);

      // Ensure local scan reports are included in the root of tree and flatList
      const scanReportFiles = [
        'osv-scanner.json',
        'trivy-report.json',
        'grype-report.json',
        'vulnerabilities-union.json',
      ];
      for (const reportFile of scanReportFiles) {
        if (!rawItems.some((item: any) => item.path === reportFile)) {
          rawItems.unshift({ path: reportFile, type: 'blob', sha: `blob-${reportFile}` });
          hierarchicalTree.unshift({ path: reportFile, name: reportFile, type: 'blob', sha: `blob-${reportFile}` });
        }
      }

      const result = {
        owner,
        repo,
        branch,
        truncated: treeData.truncated || false,
        totalFiles: rawItems.filter((i: any) => i.type === 'blob').length,
        totalDirs,
        tree: hierarchicalTree,
        flatList: rawItems.map((item: any) => ({
          path: item.path,
          type: item.type,
          size: item.size,
        })),
      };

      treeCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    // If GitHub API failed (e.g. rate limit 403 or network drop), try local clone fallback
    const localResult = getTreeFromLocalCache(owner, repo, branch || 'master');
    if (localResult) {
      treeCache.set(cacheKey, { data: localResult, timestamp: Date.now() });
      return NextResponse.json(localResult);
    }

    // Try shallow clone as last fallback
    const cacheBaseDir = path.join('/tmp', 'scanner-cache');
    if (!fs.existsSync(cacheBaseDir)) {
      fs.mkdirSync(cacheBaseDir, { recursive: true });
    }
    const targetDir = path.join(cacheBaseDir, `${owner}_${repo}`);
    try {
      await execAsync(`git clone --depth 1 https://github.com/${owner}/${repo}.git "${targetDir}"`, {
        timeout: 25000,
      });
      const clonedResult = getTreeFromLocalCache(owner, repo, branch || 'master');
      if (clonedResult) {
        treeCache.set(cacheKey, { data: clonedResult, timestamp: Date.now() });
        return NextResponse.json(clonedResult);
      }
    } catch {
      // ignore
    }

    const errJson = await treeRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: errJson.message || `Failed to fetch tree for ${owner}/${repo}@${branch}` },
      { status: treeRes.status }
    );
  } catch (err: any) {
    // Attempt local cache fallback
    const localResult = getTreeFromLocalCache(owner, repo, branch || 'master');
    if (localResult) {
      return NextResponse.json(localResult);
    }

    return NextResponse.json(
      { error: err.message || 'Internal server error while fetching repo tree' },
      { status: 500 }
    );
  }
}
