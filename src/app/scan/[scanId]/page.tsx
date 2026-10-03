'use client';

import React, { use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SecurityWorkspace } from '@/components/workspace/SecurityWorkspace';

function WorkspaceContent({ scanId }: { scanId: string }) {
  const searchParams = useSearchParams();
  const repo = searchParams.get('repo') || (scanId.includes('golang') ? 'https://github.com/golang/net' : 'https://github.com/golang/net');
  const preset = searchParams.get('preset') as 'lodash-vuln' | 'safe-filter' | 'jwt-vuln' | null;

  return (
    <SecurityWorkspace
      scanId={scanId}
      initialRepoUrl={repo}
      initialPreset={preset || undefined}
    />
  );
}

export default function ScanWorkspacePage({
  params,
}: {
  params: Promise<{ scanId: string }>;
}) {
  const resolvedParams = use(params);
  const scanId = resolvedParams.scanId || 'scan-workspace-active';

  return (
    <Suspense fallback={<div style={{ background: '#ffffff', color: '#334155', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif', fontSize: '13px' }}>Loading Security Workspace...</div>}>
      <WorkspaceContent scanId={scanId} />
    </Suspense>
  );
}
