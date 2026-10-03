import { NextRequest, NextResponse } from 'next/server';

const commitsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const repo = searchParams.get('repo');
  const branch = searchParams.get('branch');

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'Missing required parameters: owner and repo' },
      { status: 400 }
    );
  }

  const cacheKey = `${owner.toLowerCase()}/${repo.toLowerCase()}/${branch || 'default'}`;
  const cached = commitsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'VSCode-Web-Editor-Monaco',
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=40${
      branch ? `&sha=${encodeURIComponent(branch)}` : ''
    }`;

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errJson.message || `Failed to fetch commits for ${owner}/${repo}` },
        { status: res.status }
      );
    }

    const commits = await res.json();
    const result = { commits };

    commitsCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error while fetching commits' },
      { status: 500 }
    );
  }
}
