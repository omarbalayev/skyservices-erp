"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { leadSchema, newLeadWithRequestSchema, requestSchema } from "./schemas";

const fail = (error: string) => ({ ok: false as const, error });
const ok = <T,>(data: T) => ({ ok: true as const, data });

// ----- Lead -----------------------------------------------------------------

/**
 * Combined Lead + first Request create. Status defaults to NEW; the first
 * Request is required (the user is asked to enter equipment type up-front).
 */
export async function createLeadWithRequest(form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = newLeadWithRequestSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const data = parsed.data;

  // Customer must be identified somehow.
  if (!data.clientId && !data.companyName && !data.contactName) {
    return fail("Müştəri seçilməlidir vəya yeni müştəri adı qeyd olunmalıdır.");
  }

  const { lead } = await prisma.$transaction(async (tx) => {
    const createdLead = await tx.lead.create({
      data: {
        source: data.source,
        clientId: data.clientId,
        // If client is selected, ignore the raw company/contact text (we'll use Client + Contact instead).
        companyName: data.clientId ? null : data.companyName,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        description: data.description,
        ownerId: data.ownerId ?? user.id,
      },
    });

    await tx.request.create({
      data: {
        leadId: createdLead.id,
        equipmentType: data.equipmentType,
        workingHeightMeters: data.workingHeightMeters,
        rentalStart: data.rentalStart,
        rentalEnd: data.rentalEnd,
        usageZone: data.usageZone,
        deliveryResponsibility: data.deliveryResponsibility,
        operatorNeeded: data.operatorNeeded,
        nightShift: data.nightShift,
        notes: data.requestNotes,
      },
    });

    return { lead: createdLead };
  });

  await audit({
    actorId: user.id,
    entityType: "Lead",
    entityId: lead.id,
    action: "CREATE",
    diff: { after: data, withInitialRequest: true },
  });
  revalidatePath("/crm/leads");
  redirect(`/crm/leads/${lead.id}`);
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
