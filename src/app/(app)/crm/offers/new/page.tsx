import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/form-field";
import { PageHeader } from "@/components/page-header";
import { fmtDate } from "@/lib/format";

async function pickRequest(formData: FormData): Promise<void> {
  "use server";
  await requireRole(CRM_EDITORS);
  const requestId = (formData.get("requestId") as string | null)?.trim();
  if (!requestId) redirect("/crm/offers/new");
  redirect(`/crm/requests/${requestId}?newOffer=1`);
}

export default async function NewOfferPickerPage() {
  await requireRole(CRM_EDITORS);

  // Sorğular eligible for a new offer: not deleted, status OPEN or QUOTED.
  const requests = await prisma.request.findMany({
    where: { deletedAt: null, status: { in: ["OPEN", "QUOTED"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      equipmentType: true,
      rentalStart: true,
      rentalEnd: true,
      lead: {
        select: {
          client: { select: { name: true } },
          companyName: true,
          contactName: true,
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Yeni təklif"
        description="Təklifin hazırlanacağı sorğunu seçin."
        actions={
          <Link
            href="/crm/offers"
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </Link>
        }
      />
      <Card>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-slate-500">
              Təklif üçün uyğun sorğu yoxdur. Əvvəlcə{" "}
              <Link href="/crm/requests/new" className="text-brand-navy underline">
                yeni sorğu yaradın
              </Link>
              .
            </p>
          ) : (
            <form action={pickRequest} className="space-y-4">
              <FormField label="Sorğu" htmlFor="requestId" required>
                <Select id="requestId" name="requestId" required defaultValue="">
                  <option value="">— Seçin —</option>
                  {requests.map((r) => {
                    const who =
                      r.lead.client?.name ?? r.lead.companyName ?? r.lead.contactName ?? "— veb sorğu";
                    const dates =
                      r.rentalStart || r.rentalEnd
                        ? ` · ${fmtDate(r.rentalStart)} → ${fmtDate(r.rentalEnd)}`
                        : "";
                    return (
                      <option key={r.id} value={r.id}>
                        {r.equipmentType} · {who}
                        {dates}
                      </option>
                    );
                  })}
                </Select>
              </FormField>
              <p className="text-xs text-slate-500">
                Seçimdən sonra sorğu səhifəsində təklif forması avtomatik açılacaq.
              </p>
              <div className="flex justify-end">
                <Button type="submit">Davam et</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
