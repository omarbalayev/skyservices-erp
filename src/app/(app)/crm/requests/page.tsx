import Link from "next/link";
import { Plus } from "lucide-react";
import type { RequestStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { REQUEST_STATUS_LABELS } from "@/lib/enum-labels";
import { fmtDate } from "@/lib/format";
import { requireUser } from "@/lib/rbac";

const STATUS_VARIANTS: Record<RequestStatus, BadgeProps["variant"]> = {
  OPEN: "info",
  QUOTED: "warning",
  REJECTED: "danger",
  CONVERTED: "success",
};

export default async function RequestsPage() {
  await requireUser();

  const rows = await prisma.request.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      lead: {
        select: {
          id: true,
          client: { select: { id: true, name: true } },
          companyName: true,
          contactName: true,
          contactPhone: true,
        },
      },
      _count: { select: { offers: { where: { deletedAt: null } } } },
    },
  });

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: "what",
      header: "Sorğu",
      cell: (r) => (
        <Link
          href={`/crm/requests/${r.id}`}
          className="font-medium text-brand-navy hover:underline"
        >
          {r.equipmentType}
          {r.workingHeightMeters ? (
            <span className="ml-1 text-xs text-slate-500">
              · {r.workingHeightMeters.toString()} m
            </span>
          ) : null}
        </Link>
      ),
    },
    {
      key: "who",
      header: "Müştəri / Kontakt",
      cell: (r) => {
        const name =
          r.lead.client?.name ?? r.lead.companyName ?? r.lead.contactName ?? "—";
        return (
          <div>
            <div>{name}</div>
            {!r.lead.client && r.lead.contactName && r.lead.companyName ? (
              <div className="text-xs text-slate-500">{r.lead.contactName}</div>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "phone",
      header: "Telefon",
      cell: (r) => r.lead.contactPhone ?? <span className="text-slate-400">—</span>,
    },
    {
      key: "period",
      header: "İcarə dövrü",
      cell: (r) =>
        r.rentalStart || r.rentalEnd ? (
          <span className="text-slate-600">
            {fmtDate(r.rentalStart)} → {fmtDate(r.rentalEnd)}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <Badge variant={STATUS_VARIANTS[r.status]}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
      ),
    },
    {
      key: "offers",
      header: "Təkliflər",
      cell: (r) => r._count.offers,
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
        title="Sorğular"
        description={`${rows.length} aktiv sorğu`}
        actions={
          <Link href="/crm/requests/new">
            <Button>
              <Plus className="h-4 w-4" />
              Yeni sorğu
            </Button>
          </Link>
        }
      />
      <DataTable data={rows} columns={columns} rowKey={(r) => r.id} empty="Hələ sorğu yoxdur." />
    </div>
  );
}
