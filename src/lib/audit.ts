import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

type AuditInput = {
  actorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  diff?: Prisma.InputJsonValue | null;
  ip?: string | null;
  userAgent?: string | null;
};

export async function audit(input: AuditInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      diff: input.diff === undefined || input.diff === null ? Prisma.JsonNull : input.diff,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
