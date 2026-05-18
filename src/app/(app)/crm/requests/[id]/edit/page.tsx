import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DeliveryResponsibility, RequestStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { FormField } from "@/components/form-field";
import { updateRequest } from "@/modules/leads/actions";
import { DELIVERY_RESPONSIBILITY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/enum-labels";
import { toDateInputValue } from "@/lib/format";

export default async function EditRequestPage({ params }: { params: { id: string } }) {
  await requireRole(CRM_EDITORS);
  const req = await prisma.request.findUnique({ where: { id: params.id } });
  if (!req || req.deletedAt) notFound();
  const reqId = req.id;

  async function action(formData: FormData): Promise<void> {
    "use server";
    await updateRequest(reqId, formData);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Sorğunu redaktə et"
        actions={
          <Link
            href={`/crm/requests/${req.id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </Link>
        }
      />
      <Card>
        <CardContent>
          <form action={action} className="space-y-4">
            <FormField label="Texnika növü" htmlFor="equipmentType" required>
              <Input id="equipmentType" name="equipmentType" defaultValue={req.equipmentType} required />
            </FormField>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField label="Status" htmlFor="status">
                <Select id="status" name="status" defaultValue={req.status}>
                  {Object.values(RequestStatus).map((s) => (
                    <option key={s} value={s}>
                      {REQUEST_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="İş hündürlüyü (m)" htmlFor="workingHeightMeters">
                <Input
                  id="workingHeightMeters"
                  name="workingHeightMeters"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={req.workingHeightMeters?.toString() ?? ""}
                />
              </FormField>
              <FormField label="Daşıma məsuliyyəti" htmlFor="deliveryResponsibility">
                <Select
                  id="deliveryResponsibility"
                  name="deliveryResponsibility"
                  defaultValue={req.deliveryResponsibility}
                >
                  {Object.values(DeliveryResponsibility).map((d) => (
                    <option key={d} value={d}>
                      {DELIVERY_RESPONSIBILITY_LABELS[d]}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Başlama tarixi" htmlFor="rentalStart">
                <Input
                  id="rentalStart"
                  name="rentalStart"
                  type="date"
                  defaultValue={toDateInputValue(req.rentalStart)}
                />
              </FormField>
              <FormField label="Bitmə tarixi" htmlFor="rentalEnd">
                <Input
                  id="rentalEnd"
                  name="rentalEnd"
                  type="date"
                  defaultValue={toDateInputValue(req.rentalEnd)}
                />
              </FormField>
            </div>
            <FormField label="İstifadə ərazisi" htmlFor="usageZone">
              <Input id="usageZone" name="usageZone" defaultValue={req.usageZone ?? ""} />
            </FormField>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <Checkbox name="operatorNeeded" value="true" defaultChecked={req.operatorNeeded} />
                Operator lazımdır
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <Checkbox name="nightShift" value="true" defaultChecked={req.nightShift} />
                Gecə növbəsi
              </label>
            </div>
            <FormField label="Qeydlər" htmlFor="notes">
              <Textarea id="notes" name="notes" defaultValue={req.notes ?? ""} rows={3} />
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
