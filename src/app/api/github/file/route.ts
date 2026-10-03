import { NextRequest, NextResponse } from 'next/server';
import { getLanguageFromPath } from '@/utils/language';
import fs from 'fs';
import path from 'path';

const fileCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const branch = searchParams.get('branch') || 'main';
  const filePath = searchParams.get('path');

  if (!owner || !repo || !filePath) {
    return NextResponse.json(
      { error: 'Missing required parameters: owner, repo, and path' },
      { status: 400 }
    );
  }

  const cacheKey = `${owner.toLowerCase()}/${repo.toLowerCase()}/${branch}/${filePath}`;
  const cached = fileCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const language = getLanguageFromPath(filePath);

  // 1. Check local cache first if cloned
  const localFilePath = path.join('/tmp', 'scanner-cache', `${owner}_${repo}`, filePath);
  if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
    try {
      const content = fs.readFileSync(localFilePath, 'utf-8');
      const result = {
        path: filePath,
        content,
        language,
        size: content.length,
      };
      fileCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    } catch {
      // Fall through to remote
    }
  }

  try {
    // 2. Try raw.githubusercontent.com (fast, no rate limits)
    for (const b of [branch, 'main', 'master']) {
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${b}/${filePath}`;
      const rawRes = await fetch(rawUrl, {
        headers: {
          'User-Agent': 'VSCode-Web-Editor-Monaco',
        },
      });

      if (rawRes.ok) {
        const content = await rawRes.text();
        const result = {
          path: filePath,
          content,
          language,
          size: content.length,
        };
        fileCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return NextResponse.json(result);
      }
    }

    // 3. Fallback to GitHub REST API contents endpoint
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'VSCode-Web-Editor-Monaco',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const apiRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
      { headers }
    );

    if (apiRes.ok) {
      const apiData = await apiRes.json();
      let content = '';

      if (apiData.content && apiData.encoding === 'base64') {
        content = Buffer.from(apiData.content, 'base64').toString('utf-8');
      } else if (typeof apiData === 'string') {
        content = apiData;
      }

      const result = {
        path: filePath,
        content,
        language,
        size: apiData.size || content.length,
      };

      fileCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return NextResponse.json(result);
    }

    const errJson = await apiRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: errJson.message || `Failed to fetch file: ${filePath}` },
      { status: apiRes.status }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error while fetching file' },
      { status: 500 }
    );
  }
}
