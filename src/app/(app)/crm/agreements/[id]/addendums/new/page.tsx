import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddendumKind, AddendumStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { createAddendum } from "@/modules/agreements/actions";
import { ADDENDUM_KIND_LABELS, ADDENDUM_STATUS_LABELS } from "@/lib/enum-labels";

export default async function NewAddendumPage({ params }: { params: { id: string } }) {
  await requireRole(CRM_EDITORS);
  const msa = await prisma.masterAgreement.findUnique({ where: { id: params.id } });
  if (!msa || msa.deletedAt) notFound();
  const msaId = msa.id;

  async function action(formData: FormData): Promise<void> {
    "use server";
    await createAddendum(msaId, formData);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yeni Əlavə"
        description={`MSA: ${msa.agreementNumber}`}
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
          <form action={action} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Növ" htmlFor="kind">
                <Select id="kind" name="kind" defaultValue={AddendumKind.RENTAL_START}>
                  {Object.values(AddendumKind).map((k) => (
                    <option key={k} value={k}>
                      {ADDENDUM_KIND_LABELS[k]}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Status" htmlFor="status">
                <Select id="status" name="status" defaultValue={AddendumStatus.DRAFT}>
                  {Object.values(AddendumStatus).map((s) => (
                    <option key={s} value={s}>
                      {ADDENDUM_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Etibarlı (başlama)" htmlFor="effectiveFrom">
                <Input id="effectiveFrom" name="effectiveFrom" type="date" />
              </FormField>
              <FormField label="Etibarlı (bitmə)" htmlFor="effectiveTo">
                <Input id="effectiveTo" name="effectiveTo" type="date" />
              </FormField>
            </div>
            <FormField label="Qeydlər" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={3} />
            </FormField>
            <p className="text-xs text-slate-500">
              Əlavə yaradıldıqdan sonra növbəti səhifədə texnika sətirləri əlavə edin.
            </p>
            <div className="flex justify-end">
              <Button type="submit">Yarat</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
