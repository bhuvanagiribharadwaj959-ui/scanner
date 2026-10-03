import { NextRequest, NextResponse } from 'next/server';
import { getScanReport, getRawReports } from '@/utils/scanStore';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ scanId: string }> }
) {
  try {
    const { scanId } = await context.params;
    if (!scanId) {
      return NextResponse.json({ error: 'scanId is required' }, { status: 400 });
    }

    const report = getScanReport(scanId);
    const rawReports = getRawReports(report);

    return NextResponse.json({
      report,
      rawReports,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scan report' },
      { status: 500 }
    );
  }
}
