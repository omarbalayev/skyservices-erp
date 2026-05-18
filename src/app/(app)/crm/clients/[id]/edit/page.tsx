import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { updateClient } from "@/modules/clients/actions";
import ClientForm from "../../client-form";

export default async function EditClientPage({ params }: { params: { id: string } }) {
  await requireRole(CRM_EDITORS);
  const client = await prisma.client.findUnique({ where: { id: params.id } });
  if (!client || client.deletedAt) notFound();

  const action = updateClient.bind(null, client.id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Müştəri: ${client.name}`}
        description="Məlumatları redaktə et"
        actions={
          <Link
            href={`/crm/clients/${client.id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </Link>
        }
      />
      <Card>
        <CardContent>
          <ClientForm
            initial={{
              name: client.name,
              voen: client.voen,
              billingAddress: client.billingAddress,
              numberingPrefix: client.numberingPrefix,
              notes: client.notes,
            }}
            action={action}
          />
        </CardContent>
      </Card>
    </div>
  );
}
