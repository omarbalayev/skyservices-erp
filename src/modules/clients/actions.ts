"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { clientSchema, contactSchema } from "./schemas";

function fail(error: string) {
  return { ok: false as const, error };
}
function ok<T>(data: T) {
  return { ok: true as const, data };
}

// ----- Client ---------------------------------------------------------------

export async function createClient(form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = clientSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  try {
    const created = await prisma.client.create({ data: parsed.data });
    await audit({
      actorId: user.id,
      entityType: "Client",
      entityId: created.id,
      action: "CREATE",
      diff: { after: parsed.data as Record<string, unknown> },
    });
    revalidatePath("/crm/clients");
    redirect(`/crm/clients/${created.id}`);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return fail("Bu VÖEN-li müştəri artıq mövcuddur.");
    }
    throw e;
  }
}

export async function updateClient(id: string, form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = clientSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const before = await prisma.client.findUnique({ where: { id } });
  if (!before || before.deletedAt) return fail("Müştəri tapılmadı");

  try {
    await prisma.client.update({ where: { id }, data: parsed.data });
    await audit({
      actorId: user.id,
      entityType: "Client",
      entityId: id,
      action: "UPDATE",
      diff: { before: before as unknown as Record<string, unknown>, after: parsed.data as Record<string, unknown> },
    });
    revalidatePath(`/crm/clients/${id}`);
    revalidatePath("/crm/clients");
    redirect(`/crm/clients/${id}`);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return fail("Bu VÖEN başqa müştəridə istifadə olunur.");
    }
    throw e;
  }
}

export async function softDeleteClient(id: string) {
  const user = await requireRole(CRM_EDITORS);
  await prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({ actorId: user.id, entityType: "Client", entityId: id, action: "DELETE" });
  revalidatePath("/crm/clients");
  redirect("/crm/clients");
}

export async function restoreClient(id: string) {
  const user = await requireRole(CRM_EDITORS);
  await prisma.client.update({ where: { id }, data: { deletedAt: null } });
  await audit({ actorId: user.id, entityType: "Client", entityId: id, action: "RESTORE" });
  revalidatePath("/crm/clients");
  revalidatePath(`/crm/clients/${id}`);
  return ok(null);
}

// ----- Contact (nested under Client) ----------------------------------------

const contactFormSchema = contactSchema.extend({
  clientId: z.string().min(1),
});

export async function addContact(form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = contactFormSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const { clientId, ...rest } = parsed.data;
  if (rest.isPrimary) {
    await prisma.contact.updateMany({
      where: { clientId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const created = await prisma.contact.create({ data: { clientId, ...rest } });
  await audit({
    actorId: user.id,
    entityType: "Contact",
    entityId: created.id,
    action: "CREATE",
    diff: { after: rest as Record<string, unknown> },
  });
  revalidatePath(`/crm/clients/${clientId}`);
  return ok(created.id);
}

export async function updateContact(id: string, form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = contactSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const before = await prisma.contact.findUnique({ where: { id } });
  if (!before || before.deletedAt) return fail("Əlaqə tapılmadı");

  if (parsed.data.isPrimary && !before.isPrimary) {
    await prisma.contact.updateMany({
      where: { clientId: before.clientId, isPrimary: true, NOT: { id } },
      data: { isPrimary: false },
    });
  }

  await prisma.contact.update({ where: { id }, data: parsed.data });
  await audit({
    actorId: user.id,
    entityType: "Contact",
    entityId: id,
    action: "UPDATE",
    diff: {
      before: before as unknown as Record<string, unknown>,
      after: parsed.data as Record<string, unknown>,
    },
  });
  revalidatePath(`/crm/clients/${before.clientId}`);
  return ok(null);
}

export async function softDeleteContact(id: string) {
  const user = await requireRole(CRM_EDITORS);
  const before = await prisma.contact.findUnique({ where: { id } });
  if (!before) return fail("Əlaqə tapılmadı");
  await prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({ actorId: user.id, entityType: "Contact", entityId: id, action: "DELETE" });
  revalidatePath(`/crm/clients/${before.clientId}`);
  return ok(null);
}
