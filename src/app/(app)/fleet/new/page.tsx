import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole, EQUIPMENT_EDITORS } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { createEquipment } from "@/modules/equipment/actions";
import EquipmentForm from "../equipment-form";

export default async function NewEquipmentPage() {
  await requireRole(EQUIPMENT_EDITORS);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Yeni texnika"
        actions={
          <Link
            href="/fleet"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </Link>
        }
      />
      <Card>
        <CardContent>
          <EquipmentForm action={createEquipment} submitLabel="Yarat" />
        </CardContent>
      </Card>
    </div>
  );
}
