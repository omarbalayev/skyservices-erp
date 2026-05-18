"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";

export type DocKind = "offer" | "msa" | "addendum";

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

/**
 * Ensures the entity has a verifyToken. Returns the token (existing or new).
 * Public verification URL: `${origin}/verify/${token}`
 */
export async function ensureVerifyToken(
  kind: DocKind,
  id: string,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const user = await requireRole(CRM_EDITORS);

  let token: string | null = null;
  if (kind === "offer") {
    const e = await prisma.offer.findUnique({ where: { id }, select: { verifyToken: true } });
    if (!e) return { ok: false, error: "Təklif tapılmadı" };
    token = e.verifyToken;
    if (!token) {
      token = generateToken();
      await prisma.offer.update({ where: { id }, data: { verifyToken: token } });
    }
  } else if (kind === "msa") {
    const e = await prisma.masterAgreement.findUnique({
      where: { id },
      select: { verifyToken: true },
    });
    if (!e) return { ok: false, error: "MSA tapılmadı" };
    token = e.verifyToken;
    if (!token) {
      token = generateToken();
      await prisma.masterAgreement.update({ where: { id }, data: { verifyToken: token } });
    }
  } else {
    const e = await prisma.addendum.findUnique({
      where: { id },
      select: { verifyToken: true },
    });
    if (!e) return { ok: false, error: "Əlavə tapılmadı" };
    token = e.verifyToken;
    if (!token) {
      token = generateToken();
      await prisma.addendum.update({ where: { id }, data: { verifyToken: token } });
    }
  }

  await audit({
    actorId: user.id,
    entityType: kind === "msa" ? "MasterAgreement" : kind === "offer" ? "Offer" : "Addendum",
    entityId: id,
    action: "GENERATE_VERIFY_TOKEN",
  });

  revalidatePath(`/crm/${kind === "offer" ? "offers" : kind === "msa" ? "agreements" : "agreements"}/${id}`);

  return { ok: true, token };
}
