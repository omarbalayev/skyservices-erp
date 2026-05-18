import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireRole, EQUIPMENT_EDITORS } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { updateEquipment } from "@/modules/equipment/actions";
import EquipmentForm from "../../equipment-form";

export default async function EditEquipmentPage({ params }: { params: { id: string } }) {
  await requireRole(EQUIPMENT_EDITORS);
  const eq = await prisma.equipment.findUnique({ where: { id: params.id } });
  if (!eq || eq.deletedAt) notFound();

  const action = updateEquipment.bind(null, eq.id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Texnika: ${eq.code} — ${eq.name}`}
        actions={
          <Link
            href={`/fleet/${eq.id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </Link>
        }
      />
      <Card>
        <CardContent>
          <EquipmentForm
            initial={{
              code: eq.code,
              name: eq.name,
              type: eq.type,
              manufacturer: eq.manufacturer,
              model: eq.model,
              year: eq.year,
              serial: eq.serial,
              dqn: eq.dqn,
              status: eq.status,
              currentLocation: eq.currentLocation,
              cmsProductUrl: eq.cmsProductUrl,
              notes: eq.notes,
            }}
            action={action}
          />
        </CardContent>
      </Card>
    </div>
  );
}
