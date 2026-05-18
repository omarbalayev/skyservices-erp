"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OfferStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { offerSchema } from "./schemas";

const fail = (error: string) => ({ ok: false as const, error });
const ok = <T,>(data: T) => ({ ok: true as const, data });

export async function addOffer(requestId: string, form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = offerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  // Auto-increment version per request
  const lastVersion = await prisma.offer.findFirst({
    where: { requestId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const created = await prisma.offer.create({
    data: {
      requestId,
      version: (lastVersion?.version ?? 0) + 1,
      ...parsed.data,
    },
  });
  await audit({
    actorId: user.id,
    entityType: "Offer",
    entityId: created.id,
    action: "CREATE",
    diff: { after: parsed.data, version: created.version },
  });
  revalidatePath(`/crm/requests/${requestId}`);
  return ok(created.id);
}

export async function updateOffer(id: string, form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = offerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const before = await prisma.offer.findUnique({ where: { id } });
  if (!before || before.deletedAt) return fail("Təklif tapılmadı");
  if (before.status !== OfferStatus.DRAFT) return fail("Yalnız 'Qaralama' statusunda redaktə mümkündür");

  await prisma.offer.update({ where: { id }, data: parsed.data });
  await audit({
    actorId: user.id,
    entityType: "Offer",
    entityId: id,
    action: "UPDATE",
    diff: { before, after: parsed.data },
  });
  revalidatePath(`/crm/offers/${id}`);
  revalidatePath(`/crm/requests/${before.requestId}`);
  redirect(`/crm/offers/${id}`);
}

export async function transitionOffer(id: string, target: OfferStatus) {
  const user = await requireRole(CRM_EDITORS);
  const before = await prisma.offer.findUnique({ where: { id } });
  if (!before || before.deletedAt) return fail("Təklif tapılmadı");

  const allowed: Record<OfferStatus, OfferStatus[]> = {
    DRAFT: [OfferStatus.SENT, OfferStatus.SUPERSEDED],
    SENT: [OfferStatus.ACCEPTED, OfferStatus.REJECTED, OfferStatus.EXPIRED, OfferStatus.SUPERSEDED],
    ACCEPTED: [OfferStatus.SUPERSEDED],
    REJECTED: [],
    EXPIRED: [OfferStatus.SUPERSEDED],
    SUPERSEDED: [],
  };
  if (!allowed[before.status].includes(target)) {
    return fail(`Status keçidi icazəli deyil: ${before.status} → ${target}`);
  }

  await prisma.offer.update({ where: { id }, data: { status: target } });
  await audit({
    actorId: user.id,
    entityType: "Offer",
    entityId: id,
    action: `TRANSITION_${target}`,
    diff: { from: before.status, to: target },
  });

  // When accepted, mark the parent Request as QUOTED at least; convert when an addendum is later created.
  if (target === OfferStatus.ACCEPTED) {
    await prisma.request.update({
      where: { id: before.requestId },
      data: { status: "QUOTED" },
    });
  }

  revalidatePath(`/crm/offers/${id}`);
  revalidatePath(`/crm/requests/${before.requestId}`);
  return ok(null);
}

export async function softDeleteOffer(id: string): Promise<void> {
  const user = await requireRole(CRM_EDITORS);
  const before = await prisma.offer.findUnique({ where: { id } });
  if (!before) throw new Error("Təklif tapılmadı");
  await prisma.offer.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({ actorId: user.id, entityType: "Offer", entityId: id, action: "DELETE" });
  revalidatePath(`/crm/requests/${before.requestId}`);
  redirect(`/crm/requests/${before.requestId}`);
}
