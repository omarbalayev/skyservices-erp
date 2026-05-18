import { AddendumStatus, EquipmentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

/**
 * Recompute equipment status from the addendum stream.
 *
 * Phase 1 rule: an equipment is `ON_RENT` if it has at least one AddendumEquipment
 * line on an `ACTIVE` Addendum whose `endedAt` is null or in the future. Otherwise
 * it falls back to `AVAILABLE`.
 *
 * `IN_REPAIR` / `IN_TRANSIT` / `RESERVED` / `OUT_OF_SERVICE` are NOT overwritten by
 * this helper — those are managed manually by garage operations (Phase 2). To opt
 * back into auto-tracking from one of those states, call `forceRecompute = true`.
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

  // Don't auto-clobber manually-set states unless caller asks.
  const protectedStatuses: EquipmentStatus[] = [
    EquipmentStatus.IN_REPAIR,
    EquipmentStatus.OUT_OF_SERVICE,
    EquipmentStatus.RESERVED,
    EquipmentStatus.IN_TRANSIT,
  ];
  if (!options.forceRecompute && protectedStatuses.includes(eq.status)) return;

  const now = new Date();
  const activeLineCount = await prisma.addendumEquipment.count({
    where: {
      equipmentId,
      OR: [{ endedAt: null }, { endedAt: { gt: now } }],
      addendum: {
        status: AddendumStatus.ACTIVE,
        deletedAt: null,
      },
    },
  });

  const target = activeLineCount > 0 ? EquipmentStatus.ON_RENT : EquipmentStatus.AVAILABLE;

  if (eq.status !== target) {
    await prisma.equipment.update({ where: { id: equipmentId }, data: { status: target } });
  }
}
