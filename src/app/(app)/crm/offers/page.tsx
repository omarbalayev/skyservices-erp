import Link from "next/link";
import type { OfferStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { OFFER_STATUS_LABELS } from "@/lib/enum-labels";
import { fmtAzn, fmtDate } from "@/lib/format";
import { requireUser } from "@/lib/rbac";

const STATUS_VARIANTS: Record<OfferStatus, BadgeProps["variant"]> = {
  DRAFT: "outline",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "danger",
  EXPIRED: "warning",
  SUPERSEDED: "default",
};

export default async function OffersPage() {
  await requireUser();

  const offers = await prisma.offer.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      request: {
        select: {
          id: true,
          equipmentType: true,
          lead: { select: { client: { select: { name: true } }, companyName: true } },
        },
      },
    },
  });

  const columns: Column<(typeof offers)[number]>[] = [
    {
      key: "label",
      header: "Təklif",
      cell: (o) => (
        <Link href={`/crm/offers/${o.id}`} className="font-medium text-brand-navy hover:underline">
          {o.request.equipmentType} · v{o.version}
        </Link>
      ),
    },
    {
      key: "customer",
      header: "Müştəri",
      cell: (o) =>
        o.request.lead.client?.name ?? o.request.lead.companyName ?? <span className="text-slate-400">—</span>,
    },
    {
      key: "fee",
      header: "Tarif",
      cell: (o) => fmtAzn(o.baseFee),
    },
    {
      key: "status",
      header: "Status",
      cell: (o) => <Badge variant={STATUS_VARIANTS[o.status]}>{OFFER_STATUS_LABELS[o.status]}</Badge>,
    },
    {
      key: "valid",
      header: "Etibarlı",
      cell: (o) => (o.validUntil ? fmtDate(o.validUntil) : <span className="text-slate-400">—</span>),
    },
    {
      key: "created",
      header: "Tarix",
      cell: (o) => <span className="text-slate-500">{fmtDate(o.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Təkliflər" description={`${offers.length} aktiv təklif`} />
      <DataTable data={offers} columns={columns} rowKey={(o) => o.id} />
    </div>
  );
}
