import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { createLead } from "@/modules/leads/actions";
import LeadForm from "../lead-form";

export default async function NewLeadPage() {
  await requireRole(CRM_EDITORS);

  const [clients, owners] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: { isActive: true, deletedAt: null, role: { in: ["OWNER", "SALES"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Yeni müraciət"
        actions={
          <Link
            href="/crm/leads"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </Link>
        }
      />
      <Card>
        <CardContent>
          <LeadForm
            clients={clients.map((c) => ({ id: c.id, label: c.name }))}
            owners={owners.map((u) => ({ id: u.id, label: u.name }))}
            action={createLead}
            submitLabel="Yarat"
          />
        </CardContent>
      </Card>
    </div>
  );
}
