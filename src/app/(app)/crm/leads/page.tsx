import Link from "next/link";
import { Plus } from "lucide-react";
import type { LeadStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from "@/lib/enum-labels";
import { fmtDate } from "@/lib/format";
import { requireUser } from "@/lib/rbac";

const STATUS_VARIANTS: Record<LeadStatus, BadgeProps["variant"]> = {
  NEW: "info",
  WORKING: "warning",
  LOST: "danger",
  CONVERTED: "success",
};

export default async function LeadsPage() {
  await requireUser();

  const rows = await prisma.lead.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      _count: { select: { requests: { where: { deletedAt: null } } } },
    },
  });

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: "who",
      header: "Müştəri",
      cell: (r) => (
        <Link
          href={`/crm/leads/${r.id}`}
          className="font-medium text-brand-navy hover:underline"
        >
          {r.client?.name ?? r.companyName ?? r.contactName ?? "—"}
        </Link>
      ),
    },
    {
      key: "source",
      header: "Mənbə",
      cell: (r) => <span className="text-slate-600">{LEAD_SOURCE_LABELS[r.source]}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge variant={STATUS_VARIANTS[r.status]}>{LEAD_STATUS_LABELS[r.status]}</Badge>,
    },
    {
      key: "requests",
      header: "Sorğular",
      cell: (r) => r._count.requests,
    },
    {
      key: "owner",
      header: "Məsul",
      cell: (r) => r.owner?.name ?? <span className="text-slate-400">—</span>,
    },
    {
      key: "created",
      header: "Tarix",
      cell: (r) => <span className="text-slate-500">{fmtDate(r.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Müraciətlər"
        description={`${rows.length} aktiv müraciət`}
        actions={
          <Link href="/crm/leads/new">
            <Button>
              <Plus className="h-4 w-4" />
              Yeni müraciət
            </Button>
          </Link>
        }
      />
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(r) => r.id}
        empty="Hələ müraciət yoxdur."
      />
    </div>
  );
}
