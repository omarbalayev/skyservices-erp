import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
}

export async function requireRole(allowed: UserRole[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    throw new Error("İcazə yoxdur (insufficient role).");
  }
  return user;
}

/** Roles that can mutate CRM data (Client/Contact/Lead/Request/Offer/MSA/Addendum). */
export const CRM_EDITORS: UserRole[] = ["OWNER", "SALES"];

/** Roles that can edit Equipment registry / status. */
export const EQUIPMENT_EDITORS: UserRole[] = ["OWNER", "GARAGE_MANAGER", "FLEET_OPS"];

export function canEdit(role: UserRole, allowed: UserRole[]): boolean {
  return allowed.includes(role);
}
