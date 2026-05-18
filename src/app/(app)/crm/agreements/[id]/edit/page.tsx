import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { updateMasterAgreement } from "@/modules/agreements/actions";
import MsaForm from "../../msa-form";

export default async function EditMsaPage({ params }: { params: { id: string } }) {
  await requireRole(CRM_EDITORS);
  const msa = await prisma.masterAgreement.findUnique({
    where: { id: params.id },
    include: { client: { select: { id: true, name: true } } },
  });
  if (!msa || msa.deletedAt) notFound();

  const action = updateMasterAgreement.bind(null, msa.id);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`MSA: ${msa.agreementNumber}`}
        description={msa.client.name}
        actions={
          <Link
            href={`/crm/agreements/${msa.id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </Link>
        }
      />
      <Card>
        <CardContent>
          <MsaForm
            clients={[{ id: msa.client.id, label: msa.client.name }]}
            clientLocked
            initial={{
              clientId: msa.clientId,
              agreementNumber: msa.agreementNumber,
              status: msa.status,
              signedAt: msa.signedAt,
              effectiveFrom: msa.effectiveFrom,
              effectiveTo: msa.effectiveTo,
              autoRenew: msa.autoRenew,
              notes: msa.notes,
            }}
            action={action}
          />
        </CardContent>
      </Card>
    </div>
  );
}
