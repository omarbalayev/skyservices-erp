import Link from "next/link";
import { Plus } from "lucide-react";
import type { EquipmentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { EQUIPMENT_STATUS_LABELS } from "@/lib/enum-labels";
import { requireUser } from "@/lib/rbac";

const STATUS_VARIANTS: Record<EquipmentStatus, BadgeProps["variant"]> = {
  AVAILABLE: "success",
  RESERVED: "info",
  OFFERED: "warning",
  ON_RENT: "warning",
  IN_TRANSIT: "info",
  IN_REPAIR: "warning",
  OUT_OF_SERVICE: "danger",
};

type Row = {
  id: string;
  code: string;
  name: string;
  type: string;
  manufacturer: string | null;
  model: string | null;
  status: EquipmentStatus;
  currentLocation: string | null;
};

export default async function FleetPage() {
  await requireUser();

  const data = (await prisma.equipment.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      manufacturer: true,
      model: true,
      status: true,
      currentLocation: true,
    },
  })) as Row[];

  const columns: Column<Row>[] = [
    {
      key: "code",
      header: "Kod",
      cell: (r) => (
        <Link href={`/fleet/${r.id}`} className="font-mono text-brand-navy hover:underline">
          {r.code}
        </Link>
      ),
    },
    { key: "name", header: "Ad", cell: (r) => r.name },
    { key: "type", header: "Növ", cell: (r) => r.type },
    {
      key: "make",
      header: "İstehsalçı / model",
      cell: (r) =>
        r.manufacturer || r.model ? (
          <span className="text-slate-700">
            {[r.manufacturer, r.model].filter(Boolean).join(" / ")}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge variant={STATUS_VARIANTS[r.status]}>{EQUIPMENT_STATUS_LABELS[r.status]}</Badge>
      ),
    },
    {
      key: "location",
      header: "Yer",
      cell: (r) => r.currentLocation ?? <span className="text-slate-400">—</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Texnika"
        description={`${data.length} qeydə alınmış vahid`}
        actions={
          <Link href="/fleet/new">
            <Button>
              <Plus className="h-4 w-4" />
              Yeni texnika
            </Button>
          </Link>
        }
      />
      <DataTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        empty="Hələ texnika əlavə edilməyib."
      />
    </div>
  );
}
