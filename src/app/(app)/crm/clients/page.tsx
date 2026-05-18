import Link from "next/link";
import { Plus } from "lucide-react";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { fmtDate } from "@/lib/format";
import { requireUser } from "@/lib/rbac";

type Row = {
  id: string;
  name: string;
  voen: string | null;
  createdAt: Date;
  contactCount: number;
  hasMsa: boolean;
};

export default async function ClientsPage() {
  await requireUser();

  const rows = await prisma.client.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      voen: true,
      createdAt: true,
      _count: { select: { contacts: { where: { deletedAt: null } } } },
      masterAgreement: { select: { id: true } },
    },
  });

  const data: Row[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    voen: r.voen,
    createdAt: r.createdAt,
    contactCount: r._count.contacts,
    hasMsa: !!r.masterAgreement,
  }));

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Ad",
      cell: (r) => (
        <Link href={`/crm/clients/${r.id}`} className="font-medium text-brand-navy hover:underline">
          {r.name}
        </Link>
      ),
    },
    { key: "voen", header: "VÖEN", cell: (r) => r.voen ?? <span className="text-slate-400">—</span> },
    { key: "contacts", header: "Əlaqələr", cell: (r) => r.contactCount },
    {
      key: "msa",
      header: "MSA",
      cell: (r) =>
        r.hasMsa ? <Badge variant="success">Var</Badge> : <Badge variant="outline">Yoxdur</Badge>,
    },
    {
      key: "created",
      header: "Yaradılma",
      cell: (r) => <span className="text-slate-500">{fmtDate(r.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Müştərilər"
        description={`${data.length} aktiv müştəri`}
        actions={
          <Link href="/crm/clients/new">
            <Button>
              <Plus className="h-4 w-4" />
              Yeni müştəri
            </Button>
          </Link>
        }
      />
      <DataTable
        data={data}
        columns={columns}
        rowKey={(r) => r.id}
        empty="Hələ müştəri əlavə edilməyib."
      />
    </div>
  );
}
