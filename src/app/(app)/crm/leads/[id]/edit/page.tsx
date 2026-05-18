import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { updateLead } from "@/modules/leads/actions";
import LeadForm from "../../lead-form";

export default async function EditLeadPage({ params }: { params: { id: string } }) {
  await requireRole(CRM_EDITORS);
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead || lead.deletedAt) notFound();

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

  const action = updateLead.bind(null, lead.id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Müraciəti redaktə et"
        actions={
          <Link
            href={`/crm/leads/${lead.id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </Link>
        }
      />
      <Card>
        <CardContent>
          <LeadForm
            initial={{
              source: lead.source,
              status: lead.status,
              lostReason: lead.lostReason,
              lostNote: lead.lostNote,
              clientId: lead.clientId,
              companyName: lead.companyName,
              contactName: lead.contactName,
              contactPhone: lead.contactPhone,
              contactEmail: lead.contactEmail,
              description: lead.description,
              ownerId: lead.ownerId,
            }}
            clients={clients.map((c) => ({ id: c.id, label: c.name }))}
            owners={owners.map((u) => ({ id: u.id, label: u.name }))}
            action={action}
          />
        </CardContent>
      </Card>
    </div>
  );
}
