import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OfferStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireRole, CRM_EDITORS } from "@/lib/rbac";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { updateOffer } from "@/modules/offers/actions";
import OfferForm from "../../../requests/[id]/offer-form";

export default async function EditOfferPage({ params }: { params: { id: string } }) {
  await requireRole(CRM_EDITORS);
  const offer = await prisma.offer.findUnique({ where: { id: params.id } });
  if (!offer || offer.deletedAt) notFound();
  if (offer.status !== OfferStatus.DRAFT) {
    notFound();
  }

  const action = updateOffer.bind(null, offer.id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Təklif v${offer.version} — redaktə`}
        actions={
          <Link
            href={`/crm/offers/${offer.id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </Link>
        }
      />
      <Card>
        <CardContent>
          <OfferForm
            initial={{
              rentalPeriodType: offer.rentalPeriodType,
              baseDaysPerMonth: offer.baseDaysPerMonth,
              baseHoursPerDay: offer.baseHoursPerDay,
              baseFee: offer.baseFee.toString(),
              belowBaselineRule: offer.belowBaselineRule,
              transportResponsibility: offer.transportResponsibility,
              operatorIncluded: offer.operatorIncluded,
              nightShift: offer.nightShift,
              vatTreatment: offer.vatTreatment,
              validUntil: offer.validUntil,
              notes: offer.notes,
            }}
            action={action}
          />
        </CardContent>
      </Card>
    </div>
  );
}
