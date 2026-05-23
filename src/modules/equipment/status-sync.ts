import { AddendumStatus, EquipmentStatus, OfferStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * Recompute equipment status from the addendum + offer streams.
 *
 * Priority (highest wins):
 *   1. Protected manual states (IN_REPAIR / OUT_OF_SERVICE / RESERVED / IN_TRANSIT)
 *      — never overwritten unless `forceRecompute = true`.
 *   2. ON_RENT — at least one AddendumEquipment line on an ACTIVE addendum
 *      whose endedAt is null or in the future.
 *   3. OFFERED — at least one OfferEquipment line on a non-deleted Offer with
 *      status DRAFT or SENT (the offer is in flight; the unit is held).
 *   4. AVAILABLE — fallback.
 */
export async function syncEquipmentStatus(
  equipmentId: string,
  options: { forceRecompute?: boolean } = {},
): Promise<void> {
  const eq = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { status: true, deletedAt: true },
  });
  if (!eq || eq.deletedAt) return;

  const protectedStatuses: EquipmentStatus[] = [
    EquipmentStatus.IN_REPAIR,
    EquipmentStatus.OUT_OF_SERVICE,
    EquipmentStatus.RESERVED,
    EquipmentStatus.IN_TRANSIT,
  ];
  if (!options.forceRecompute && protectedStatuses.includes(eq.status)) return;

  const now = new Date();
  const activeAddendumLines = await prisma.addendumEquipment.count({
    where: {
      equipmentId,
      OR: [{ endedAt: null }, { endedAt: { gt: now } }],
      addendum: {
        status: AddendumStatus.ACTIVE,
        deletedAt: null,
      },
    },
  });

  let target: EquipmentStatus;
  if (activeAddendumLines > 0) {
    target = EquipmentStatus.ON_RENT;
  } else {
    const openOfferLines = await prisma.offerEquipment.count({
      where: {
        equipmentId,
        offer: {
          status: { in: [OfferStatus.DRAFT, OfferStatus.SENT] },
          deletedAt: null,
        },
      },
    });
    target = openOfferLines > 0 ? EquipmentStatus.OFFERED : EquipmentStatus.AVAILABLE;
  }

  if (eq.status !== target) {
    await prisma.equipment.update({ where: { id: equipmentId }, data: { status: target } });
  }
}
