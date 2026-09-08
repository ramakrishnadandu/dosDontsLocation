import type { AuditAction } from "@locaguide/contracts";
import { prisma } from "@locaguide/db";

export interface AuditEntryInput {
  actorId: string | null;
  action: AuditAction;
  resource: string;
  result: "SUCCESS" | "FAILURE";
  requestId: string;
  correlationId: string;
}

/** Writes a security-sensitive audit log entry (section 22). Never pass secrets/tokens in `resource`. */
export async function recordAudit(entry: AuditEntryInput): Promise<void> {
  await prisma.auditLog.create({ data: entry });
}
