import Link from "next/link";
import { Plus } from "lucide-react";
import type { MasterAgreementStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { MSA_STATUS_LABELS } from "@/lib/enum-labels";
import { fmtDate } from "@/lib/format";
import { requireUser } from "@/lib/rbac";

const STATUS_VARIANTS: Record<MasterAgreementStatus, BadgeProps["variant"]> = {
  DRAFT: "outline",
  SIGNED: "info",
  ACTIVE: "success",
  EXPIRED: "warning",
  TERMINATED: "danger",
};

export default async function AgreementsPage() {
  await requireUser();

  const rows = await prisma.masterAgreement.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { addendums: { where: { deletedAt: null } } } },
    },
  });

  const columns: Column<(typeof rows)[number]>[] = [
    {
      key: "number",
      header: "Müqavilə №",
      cell: (r) => (
        <Link href={`/crm/agreements/${r.id}`} className="font-mono text-brand-navy hover:underline">
          {r.agreementNumber}
        </Link>
      ),
    },
    { key: "client", header: "Müştəri", cell: (r) => r.client.name },
    {
      key: "status",
      header: "Status",
      cell: (r) => <Badge variant={STATUS_VARIANTS[r.status]}>{MSA_STATUS_LABELS[r.status]}</Badge>,
    },
    {
      key: "period",
      header: "Etibarlılıq",
      cell: (r) => (
        <span className="text-slate-600">
          {fmtDate(r.effectiveFrom)} → {fmtDate(r.effectiveTo)}
        </span>
      ),
    },
    { key: "addendums", header: "Əlavələr", cell: (r) => r._count.addendums },
    {
      key: "auto",
      header: "Avto. yenilənmə",
      cell: (r) =>
        r.autoRenew ? <Badge variant="info">Bəli</Badge> : <Badge variant="outline">Xeyr</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Müqavilələr (MSA)"
        description={`${rows.length} müqavilə`}
        actions={
          <Link href="/crm/agreements/new">
            <Button>
              <Plus className="h-4 w-4" /> Yeni MSA
            </Button>
          </Link>
        }
      />
      <DataTable data={rows} columns={columns} rowKey={(r) => r.id} />
    </div>
  );
}
