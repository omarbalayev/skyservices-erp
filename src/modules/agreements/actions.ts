"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AddendumKind, AddendumStatus, MasterAgreementStatus, OfferStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { syncEquipmentStatus } from "@/modules/equipment/status-sync";
import {
  addendumEquipmentSchema,
  addendumSchema,
  masterAgreementSchema,
} from "./schemas";

type PrismaLikeForCheck = {
  masterAgreement: { findUnique: (args: { where: { agreementNumber: string } }) => Promise<unknown> };
};

/**
 * Generate a system-wide MSA contract number.
 * Format: `SKY` + DDMMYYYY (matches existing convention, e.g. SKY18042026).
 * If today already has an MSA, appends `-2`, `-3`, …
 */
async function generateAgreementNumber(client: PrismaLikeForCheck): Promise<string> {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const base = `SKY${dd}${mm}${yyyy}`;

  // Optimistic check + suffix probe (collision rare; this is fine without a counter table).
  let candidate = base;
  let n = 2;
  while (await client.masterAgreement.findUnique({ where: { agreementNumber: candidate } })) {
    candidate = `${base}-${n}`;
    n += 1;
    if (n > 50) throw new Error("Müqavilə nömrəsinin yaradılması alınmadı.");
  }
  return candidate;
}

const fail = (error: string) => ({ ok: false as const, error });
const ok = <T,>(data: T) => ({ ok: true as const, data });

// ----- MasterAgreement ------------------------------------------------------

export async function createMasterAgreement(form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = masterAgreementSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  // Auto-generate the contract number if the form didn't supply one.
  const agreementNumber = parsed.data.agreementNumber ?? (await generateAgreementNumber(prisma));

  try {
    const created = await prisma.masterAgreement.create({
      data: { ...parsed.data, agreementNumber },
    });
    await audit({
      actorId: user.id,
      entityType: "MasterAgreement",
      entityId: created.id,
      action: "CREATE",
      diff: { after: { ...parsed.data, agreementNumber } },
    });
    revalidatePath("/crm/agreements");
    redirect(`/crm/agreements/${created.id}`);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return fail("Bu müştəri üçün artıq MSA var, və ya bu müqavilə nömrəsi istifadədədir.");
    }
    throw e;
  }
}

export async function updateMasterAgreement(id: string, form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = masterAgreementSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const before = await prisma.masterAgreement.findUnique({ where: { id } });
  if (!before || before.deletedAt) return fail("MSA tapılmadı");

  try {
    // clientId is immutable. If agreementNumber wasn't provided, keep the existing one.
    const { clientId: _ignored, agreementNumber, ...rest } = parsed.data;
    void _ignored;
    await prisma.masterAgreement.update({
      where: { id },
      data: {
        ...rest,
        ...(agreementNumber ? { agreementNumber } : {}),
      },
    });
    await audit({
      actorId: user.id,
      entityType: "MasterAgreement",
      entityId: id,
      action: "UPDATE",
      diff: { before, after: { ...rest, agreementNumber } },
    });
    revalidatePath(`/crm/agreements/${id}`);
    revalidatePath("/crm/agreements");
    redirect(`/crm/agreements/${id}`);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return fail("Bu müqavilə nömrəsi başqasında istifadədədir.");
    }
    throw e;
  }
}

export async function softDeleteMasterAgreement(id: string): Promise<void> {
  const user = await requireRole(CRM_EDITORS);
  await prisma.masterAgreement.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({ actorId: user.id, entityType: "MasterAgreement", entityId: id, action: "DELETE" });
  revalidatePath("/crm/agreements");
  redirect("/crm/agreements");
}

// ----- Addendum (under an MSA) ----------------------------------------------

export async function createAddendum(masterAgreementId: string, form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = addendumSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const last = await prisma.addendum.findFirst({
    where: { masterAgreementId },
    orderBy: { addendumNumber: "desc" },
    select: { addendumNumber: true },
  });
  const addendumNumber = (last?.addendumNumber ?? 0) + 1;

  const created = await prisma.addendum.create({
    data: {
      masterAgreementId,
      addendumNumber,
      ...parsed.data,
    },
  });
  await audit({
    actorId: user.id,
    entityType: "Addendum",
    entityId: created.id,
    action: "CREATE",
    diff: { after: parsed.data, addendumNumber },
  });
  revalidatePath(`/crm/agreements/${masterAgreementId}`);
  redirect(`/crm/agreements/${masterAgreementId}/addendums/${created.id}`);
}

export async function updateAddendum(id: string, form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = addendumSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const before = await prisma.addendum.findUnique({ where: { id } });
  if (!before || before.deletedAt) return fail("Əlavə tapılmadı");

  await prisma.addendum.update({ where: { id }, data: parsed.data });
  await audit({
    actorId: user.id,
    entityType: "Addendum",
    entityId: id,
    action: "UPDATE",
    diff: { before, after: parsed.data },
  });
  revalidatePath(`/crm/agreements/${before.masterAgreementId}/addendums/${id}`);
  revalidatePath(`/crm/agreements/${before.masterAgreementId}`);
  redirect(`/crm/agreements/${before.masterAgreementId}/addendums/${id}`);
}

export async function transitionAddendum(id: string, target: AddendumStatus): Promise<void> {
  const user = await requireRole(CRM_EDITORS);
  const before = await prisma.addendum.findUnique({ where: { id } });
  if (!before || before.deletedAt) throw new Error("Əlavə tapılmadı");

  const allowed: Record<AddendumStatus, AddendumStatus[]> = {
    DRAFT: [AddendumStatus.SIGNED, AddendumStatus.SUPERSEDED],
    SIGNED: [AddendumStatus.ACTIVE, AddendumStatus.SUPERSEDED],
    ACTIVE: [AddendumStatus.SUPERSEDED],
    SUPERSEDED: [],
  };
  if (!allowed[before.status].includes(target)) {
    throw new Error(`Status keçidi icazəli deyil: ${before.status} → ${target}`);
  }

  await prisma.addendum.update({ where: { id }, data: { status: target } });
  await audit({
    actorId: user.id,
    entityType: "Addendum",
    entityId: id,
    action: `TRANSITION_${target}`,
    diff: { from: before.status, to: target },
  });

  // When the originating RENTAL_START addendum reaches ACTIVE, mark Offer/Request CONVERTED.
  if (target === AddendumStatus.ACTIVE && before.kind === AddendumKind.RENTAL_START && before.offerId) {
    await prisma.offer.update({
      where: { id: before.offerId },
      data: { status: OfferStatus.SUPERSEDED },
    });
  }
  // Auto-flip MSA to ACTIVE when first addendum activates.
  if (target === AddendumStatus.ACTIVE) {
    await prisma.masterAgreement.update({
      where: { id: before.masterAgreementId },
      data: { status: MasterAgreementStatus.ACTIVE },
    });
  }

  // Re-sync equipment status for every line on this addendum (ACTIVE → ON_RENT, SUPERSEDED → AVAILABLE).
  const lines = await prisma.addendumEquipment.findMany({
    where: { addendumId: id },
    select: { equipmentId: true },
  });
  for (const l of lines) {
    await syncEquipmentStatus(l.equipmentId);
  }

  revalidatePath(`/crm/agreements/${before.masterAgreementId}/addendums/${id}`);
  revalidatePath(`/crm/agreements/${before.masterAgreementId}`);
}

export async function softDeleteAddendum(id: string): Promise<void> {
  const user = await requireRole(CRM_EDITORS);
  const before = await prisma.addendum.findUnique({ where: { id } });
  if (!before) throw new Error("Əlavə tapılmadı");
  await prisma.addendum.update({ where: { id }, data: { deletedAt: new Date() } });
  await audit({ actorId: user.id, entityType: "Addendum", entityId: id, action: "DELETE" });
  // Re-sync equipment status for every line on this addendum.
  const lines = await prisma.addendumEquipment.findMany({
    where: { addendumId: id },
    select: { equipmentId: true },
  });
  for (const l of lines) {
    await syncEquipmentStatus(l.equipmentId);
  }
  revalidatePath(`/crm/agreements/${before.masterAgreementId}`);
  redirect(`/crm/agreements/${before.masterAgreementId}`);
}

// ----- AddendumEquipment ----------------------------------------------------

export async function addAddendumEquipment(addendumId: string, form: FormData) {
  const user = await requireRole(CRM_EDITORS);
  const parsed = addendumEquipmentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fail(parsed.error.errors[0]?.message ?? "Yoxlama xətası");

  const addendum = await prisma.addendum.findUnique({ where: { id: addendumId } });
  if (!addendum || addendum.deletedAt) return fail("Əlavə tapılmadı");

  // Reject if the equipment is already on an active line on another addendum.
  const busy = await prisma.addendumEquipment.findFirst({
    where: {
      equipmentId: parsed.data.equipmentId,
      addendumId: { not: addendumId },
      OR: [{ endedAt: null }, { endedAt: { gt: new Date() } }],
      addendum: { status: AddendumStatus.ACTIVE, deletedAt: null },
    },
    select: {
      id: true,
      addendum: {
        select: {
          addendumNumber: true,
          masterAgreement: { select: { agreementNumber: true } },
        },
      },
    },
  });
  if (busy) {
    return fail(
      `Texnika başqa aktiv əlavədə istifadədədir: MSA ${busy.addendum.masterAgreement.agreementNumber}, Əlavə ${busy.addendum.addendumNumber}.`,
    );
  }

  const created = await prisma.addendumEquipment.create({
    data: { addendumId, ...parsed.data },
  });
  await audit({
    actorId: user.id,
    entityType: "AddendumEquipment",
    entityId: created.id,
    action: "CREATE",
    diff: { after: parsed.data },
  });
  await syncEquipmentStatus(parsed.data.equipmentId);
  revalidatePath(`/crm/agreements/${addendum.masterAgreementId}/addendums/${addendumId}`);
  return ok(created.id);
}

export async function removeAddendumEquipment(id: string): Promise<void> {
  const user = await requireRole(CRM_EDITORS);
  const before = await prisma.addendumEquipment.findUnique({
    where: { id },
    include: { addendum: { select: { masterAgreementId: true, id: true } } },
  });
  if (!before) throw new Error("Sətir tapılmadı");
  await prisma.addendumEquipment.delete({ where: { id } });
  await audit({ actorId: user.id, entityType: "AddendumEquipment", entityId: id, action: "DELETE" });
  await syncEquipmentStatus(before.equipmentId);
  revalidatePath(`/crm/agreements/${before.addendum.masterAgreementId}/addendums/${before.addendum.id}`);
}

// ----- Convenience: create MSA + RENTAL_START addendum from an accepted Offer

export async function createMsaAndAddendumFromOffer(offerId: string, form: FormData) {
  const user = await requireRole(CRM_EDITORS);

  // form fields: agreementNumber, clientId (optional - inferred from offer's lead if missing),
  // effectiveFrom, effectiveTo, autoRenew, equipmentId
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { request: { include: { lead: true } } },
  });
  if (!offer || offer.deletedAt) return fail("Təklif tapılmadı");
  if (offer.status !== OfferStatus.ACCEPTED) return fail("Yalnız 'Qəbul edildi' təklifindən yaradılır");

  const clientId = (form.get("clientId") as string | null) ?? offer.request.lead.clientId;
  if (!clientId) {
    return fail("Müştəri seçilməyib. Əvvəlcə müraciəti mövcud müştəriyə bağlayın.");
  }

  const effectiveFromRaw = form.get("effectiveFrom") as string | null;
  const effectiveToRaw = form.get("effectiveTo") as string | null;
  const equipmentId = form.get("equipmentId") as string | null;
  if (!equipmentId) return fail("Texnika seçilməyib");

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create MSA for this client.
      let msa = await tx.masterAgreement.findUnique({ where: { clientId } });
      if (!msa) {
        const agreementNumber = await generateAgreementNumber(tx);
        msa = await tx.masterAgreement.create({
          data: {
            clientId,
            agreementNumber,
            status: MasterAgreementStatus.DRAFT,
            effectiveFrom: effectiveFromRaw ? new Date(effectiveFromRaw) : null,
            effectiveTo: effectiveToRaw ? new Date(effectiveToRaw) : null,
            autoRenew: true,
          },
        });
      }
      // 2. Create RENTAL_START Addendum (next number).
      const last = await tx.addendum.findFirst({
        where: { masterAgreementId: msa.id },
        orderBy: { addendumNumber: "desc" },
        select: { addendumNumber: true },
      });
      const addendum = await tx.addendum.create({
        data: {
          masterAgreementId: msa.id,
          addendumNumber: (last?.addendumNumber ?? 0) + 1,
          kind: AddendumKind.RENTAL_START,
          status: AddendumStatus.DRAFT,
          offerId: offer.id,
          effectiveFrom: effectiveFromRaw ? new Date(effectiveFromRaw) : null,
          effectiveTo: effectiveToRaw ? new Date(effectiveToRaw) : null,
        },
      });
      // 3. Reject double-booking.
      const busy = await tx.addendumEquipment.findFirst({
        where: {
          equipmentId,
          OR: [{ endedAt: null }, { endedAt: { gt: new Date() } }],
          addendum: { status: AddendumStatus.ACTIVE, deletedAt: null },
        },
        select: {
          addendum: {
            select: {
              addendumNumber: true,
              masterAgreement: { select: { agreementNumber: true } },
            },
          },
        },
      });
      if (busy) {
        throw new Error(
          `Texnika başqa aktiv əlavədə istifadədədir: MSA ${busy.addendum.masterAgreement.agreementNumber}, Əlavə ${busy.addendum.addendumNumber}.`,
        );
      }

      // 4. Create AddendumEquipment line copying pricing from the offer.
      await tx.addendumEquipment.create({
        data: {
          addendumId: addendum.id,
          equipmentId,
          rentalPeriodType: offer.rentalPeriodType,
          baseDaysPerMonth: offer.baseDaysPerMonth,
          baseHoursPerDay: offer.baseHoursPerDay,
          baseFee: offer.baseFee,
          belowBaselineRule: offer.belowBaselineRule,
          operatorIncluded: offer.operatorIncluded,
          nightShift: offer.nightShift,
          transportResponsibility: offer.transportResponsibility,
          vatTreatment: offer.vatTreatment,
          startedAt: effectiveFromRaw ? new Date(effectiveFromRaw) : null,
        },
      });
      // 4. Link Lead to Client if not yet linked.
      if (!offer.request.lead.clientId) {
        await tx.lead.update({
          where: { id: offer.request.lead.id },
          data: { clientId, status: "CONVERTED" },
        });
      } else if (offer.request.lead.status !== "CONVERTED") {
        await tx.lead.update({
          where: { id: offer.request.lead.id },
          data: { status: "CONVERTED" },
        });
      }
      await tx.request.update({
        where: { id: offer.request.id },
        data: { status: "CONVERTED" },
      });
      return { msaId: msa.id, addendumId: addendum.id };
    });

    await audit({
      actorId: user.id,
      entityType: "MasterAgreement",
      entityId: result.msaId,
      action: "CONVERT_FROM_OFFER",
      diff: { offerId: offer.id, addendumId: result.addendumId },
    });

    // Sync the equipment status (RENTAL_START addendum starts in DRAFT, so this is a no-op now —
    // it will flip to ON_RENT when the operator transitions the addendum to ACTIVE).
    await syncEquipmentStatus(equipmentId);

    revalidatePath(`/crm/offers/${offer.id}`);
    revalidatePath("/crm/agreements");
    redirect(`/crm/agreements/${result.msaId}/addendums/${result.addendumId}`);
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique constraint")) {
      return fail("Bu müqavilə nömrəsi artıq istifadədədir.");
    }
    if (e instanceof Error && e.message.startsWith("Texnika başqa aktiv")) {
      return fail(e.message);
    }
    throw e;
  }
}
