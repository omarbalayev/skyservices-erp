"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { leadSchema, requestSchema } from "./schemas";

const fail = (error: string) => ({ ok: false as const, error });
const ok = <T,>(data: T) => ({ ok: true as const, data });

// ----- Lead -----------------------------------------------------------------

export async function createLead(form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = leadSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const created = await prisma.lead.create({
    data: {
      ...parsed.data,
      ownerId: parsed.data.ownerId ?? user.id,
    },
  });
  await audit({
    actorId: user.id,
    entityType: "Lead",
    entityId: created.id,
    action: "CREATE",
    diff: { after: parsed.data },
  });
  revalidatePath("/crm/leads");
  redirect(`/crm/leads/${created.id}`);
}

export async function updateLead(id: string, form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = leadSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const before = await prisma.lead.findUnique({ where: { id } });
  if (!before || before.deletedAt) return fail("Müraciət tapılmadı");

  await prisma.lead.update({ where: { id }, data: parsed.data });
  await audit({
    actorId: user.id,
    entityType: "Lead",
    entityId: id,
    action: "UPDATE",
    diff: { before, after: parsed.data },
  });
  revalidatePath(`/crm/leads/${id}`);
  revalidatePath("/crm/leads");
  redirect(`/crm/leads/${id}`);
}

export async function softDeleteLead(id: string) {
  const user = await requireRole(CRM_EDITORS);
  await prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({ actorId: user.id, entityType: "Lead", entityId: id, action: "DELETE" });
  revalidatePath("/crm/leads");
  redirect("/crm/leads");
}

// ----- Request (nested under Lead) ------------------------------------------

export async function addRequest(leadId: string, form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = requestSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const created = await prisma.request.create({ data: { leadId, ...parsed.data } });
  await audit({
    actorId: user.id,
    entityType: "Request",
    entityId: created.id,
    action: "CREATE",
    diff: { after: parsed.data },
  });
  revalidatePath(`/crm/leads/${leadId}`);
  return ok(created.id);
}

export async function updateRequest(id: string, form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = requestSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const before = await prisma.request.findUnique({ where: { id } });
  if (!before || before.deletedAt) return fail("Sorğu tapılmadı");

  await prisma.request.update({ where: { id }, data: parsed.data });
  await audit({
    actorId: user.id,
    entityType: "Request",
    entityId: id,
    action: "UPDATE",
    diff: { before, after: parsed.data },
  });
  revalidatePath(`/crm/leads/${before.leadId}`);
  revalidatePath(`/crm/requests/${id}`);
  redirect(`/crm/requests/${id}`);
}

export async function softDeleteRequest(id: string): Promise<void> {
  const user = await requireRole(CRM_EDITORS);
  const before = await prisma.request.findUnique({ where: { id } });
  if (!before) throw new Error("Sorğu tapılmadı");
  await prisma.request.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({ actorId: user.id, entityType: "Request", entityId: id, action: "DELETE" });
  revalidatePath(`/crm/leads/${before.leadId}`);
  redirect(`/crm/leads/${before.leadId}`);
}
