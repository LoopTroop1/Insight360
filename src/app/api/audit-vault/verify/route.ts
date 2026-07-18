import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function sha256(data: string) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// GET /api/audit-vault/verify
// Checks integrity of the chained audit log entries in dev.db
export async function GET(request: Request) {
  try {
    const logs = await db.auditLogEntry.findMany({
      orderBy: { id: 'asc' }
    });

    let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
    let verifiedCount = 0;

    for (const log of logs) {
      // 1. Verify previous hash link matches
      if (log.previousHash !== prevHash) {
        return NextResponse.json({
          success: false,
          error: `Chain broken at Log ID ${log.id}. Stored previousHash does not match computed chain hash.`,
          corruptLogId: log.id
        });
      }

      // 2. Recompute current hash
      const timestampTime = new Date(log.timestamp).getTime();
      const hashInput = prevHash + `${log.actorId}-${log.actionType}-${log.entityId}-${log.entityType}-${log.details}-${timestampTime}`;
      const computedHash = sha256(hashInput);

      if (log.currentHash !== computedHash) {
        return NextResponse.json({
          success: false,
          error: `Hash mismatch at Log ID ${log.id}. Stored currentHash has been tampered with.`,
          corruptLogId: log.id
        });
      }

      prevHash = log.currentHash;
      verifiedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Database ledger validated successfully. Checked ${verifiedCount} nodes in sequence. Zero anomalies detected.`,
      nodesChecked: verifiedCount
    });
  } catch (error) {
    console.error('Error during audit log validation:', error);
    return NextResponse.json({ error: 'Audit ledger validation failed' }, { status: 500 });
  }
}
