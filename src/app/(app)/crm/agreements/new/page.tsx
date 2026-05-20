import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/db";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { createMasterAgreement } from "@/modules/agreements/actions";
import MsaForm from "../msa-form";

export default async function NewMsaPage() {
  await requireRole(CRM_EDITORS);

  // Only clients that DON'T already have an MSA.
  const clients = await prisma.client.findMany({
    where: { deletedAt: null, masterAgreement: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yeni MSA (Müqavilə)"
        description="Hər müştəri üçün yalnız bir MSA olur. Sonra dəyişikliklər Əlavələrlə (Addendum) edilir."
        actions={
          <Link
            href="/crm/agreements"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </Link>
        }
      />
      <Card>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-sm text-slate-500">
              MSA üçün uyğun müştəri yoxdur. Əvvəlcə{" "}
              <Link href="/crm/clients/new" className="text-brand-navy underline">
                yeni müştəri yaradın
              </Link>
              .
            </p>
          ) : (
            <MsaForm
              clients={clients.map((c) => ({ id: c.id, label: c.name }))}
              showAgreementNumber={false}
              action={createMasterAgreement}
              submitLabel="MSA yarat"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
