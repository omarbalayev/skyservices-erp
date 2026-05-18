"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireRole, EQUIPMENT_EDITORS } from "@/lib/rbac";
import { equipmentSchema } from "./schemas";

const fail = (error: string) => ({ ok: false as const, error });

export async function createEquipment(form: FormData) {
  const user = await requireRole(EQUIPMENT_EDITORS);
  const parsed = equipmentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  try {
    const created = await prisma.equipment.create({ data: parsed.data });
    await audit({
      actorId: user.id,
      entityType: "Equipment",
      entityId: created.id,
      action: "CREATE",
      diff: { after: parsed.data },
    });
    revalidatePath("/fleet");
    redirect(`/fleet/${created.id}`);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return fail("Bu kod artıq istifadədədir.");
    }
    throw e;
  }
}

export async function updateEquipment(id: string, form: FormData) {
  const user = await requireRole(EQUIPMENT_EDITORS);
  const parsed = equipmentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const before = await prisma.equipment.findUnique({ where: { id } });
  if (!before || before.deletedAt) return fail("Texnika tapılmadı");

  try {
    await prisma.equipment.update({ where: { id }, data: parsed.data });
    await audit({
      actorId: user.id,
      entityType: "Equipment",
      entityId: id,
      action: "UPDATE",
      diff: { before, after: parsed.data },
    });
    revalidatePath(`/fleet/${id}`);
    revalidatePath("/fleet");
    redirect(`/fleet/${id}`);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return fail("Bu kod artıq başqa texnikada istifadədədir.");
    }
    throw e;
  }
}

export async function softDeleteEquipment(id: string) {
  const user = await requireRole(EQUIPMENT_EDITORS);
  await prisma.equipment.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({ actorId: user.id, entityType: "Equipment", entityId: id, action: "DELETE" });
  revalidatePath("/fleet");
  redirect("/fleet");
}
