import { z } from "zod";

export const ReportReason = z.enum([
  "SPAM",
  "HARASSMENT",
  "PERSONAL_INFORMATION",
  "DEFAMATION_RISK",
  "FRAUD",
  "MALICIOUS_LINK",
  "UNSAFE_CONTENT",
  "OTHER",
]);
export type ReportReason = z.infer<typeof ReportReason>;

export const ModerationSignal = z.object({
  isSpam: z.boolean(),
  spamScore: z.number().min(0).max(1),
  isDuplicate: z.boolean(),
  containsPersonalInformation: z.boolean(),
  containsMaliciousLink: z.boolean(),
  toxicityScore: z.number().min(0).max(1),
});
export type ModerationSignal = z.infer<typeof ModerationSignal>;

export const ModerationCaseStatus = z.enum([
  "OPEN",
  "IN_REVIEW",
  "RESOLVED_APPROVED",
  "RESOLVED_REJECTED",
  "APPEALED",
]);
export type ModerationCaseStatus = z.infer<typeof ModerationCaseStatus>;

export const AuditAction = z.enum([
  "LOGIN",
  "LOGOUT",
  "ROLE_CHANGE",
  "ADMIN_ACTION",
  "MODERATION_ACTION",
  "PROVIDER_CONFIG_CHANGE",
  "AI_CONFIG_CHANGE",
  "POLICY_CHANGE",
  "DATA_DELETION",
  "DATA_EXPORT",
  "SECURITY_EVENT",
]);
export type AuditAction = z.infer<typeof AuditAction>;

export const AuditLogEntry = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  actorId: z.string().nullable(),
  action: AuditAction,
  resource: z.string(),
  result: z.enum(["SUCCESS", "FAILURE"]),
  requestId: z.string(),
  correlationId: z.string(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntry>;
