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
import { updateAddendum } from "@/modules/agreements/actions";
import { ADDENDUM_KIND_LABELS, ADDENDUM_STATUS_LABELS } from "@/lib/enum-labels";
import { toDateInputValue } from "@/lib/format";

export default async function EditAddendumPage({
  params,
}: {
  params: { id: string; addid: string };
}) {
  await requireRole(CRM_EDITORS);
  const addendum = await prisma.addendum.findUnique({ where: { id: params.addid } });
  if (!addendum || addendum.deletedAt) notFound();
  if (addendum.masterAgreementId !== params.id) notFound();
  const addId = addendum.id;

  async function action(formData: FormData): Promise<void> {
    "use server";
    await updateAddendum(addId, formData);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Əlavə ${addendum.addendumNumber} — redaktə`}
        actions={
          <Link
            href={`/crm/agreements/${addendum.masterAgreementId}/addendums/${addendum.id}`}
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
                <Select id="kind" name="kind" defaultValue={addendum.kind}>
                  {Object.values(AddendumKind).map((k) => (
                    <option key={k} value={k}>
                      {ADDENDUM_KIND_LABELS[k]}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Status" htmlFor="status">
                <Select id="status" name="status" defaultValue={addendum.status}>
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
                <Input
                  id="effectiveFrom"
                  name="effectiveFrom"
                  type="date"
                  defaultValue={toDateInputValue(addendum.effectiveFrom)}
                />
              </FormField>
              <FormField label="Etibarlı (bitmə)" htmlFor="effectiveTo">
                <Input
                  id="effectiveTo"
                  name="effectiveTo"
                  type="date"
                  defaultValue={toDateInputValue(addendum.effectiveTo)}
                />
              </FormField>
            </div>
            <FormField label="Qeydlər" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={3} defaultValue={addendum.notes ?? ""} />
            </FormField>
            <div className="flex justify-end">
              <Button type="submit">Yadda saxla</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
