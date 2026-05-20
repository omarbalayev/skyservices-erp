import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { OfferStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireUser, CRM_EDITORS, canEdit } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { PipelineStepper } from "@/components/pipeline-stepper";
import { NextActionBanner } from "@/components/next-action-banner";
import { fmtAzn, fmtDate } from "@/lib/format";
import {
  OFFER_STATUS_LABELS,
  RENTAL_PERIOD_TYPE_LABELS,
  TRANSPORT_RESPONSIBILITY_LABELS,
  VAT_TREATMENT_LABELS,
} from "@/lib/enum-labels";
import { softDeleteOffer, transitionOffer } from "@/modules/offers/actions";
import ConvertPanel from "./convert-panel";
import DocActions from "@/components/doc-actions";

const STATUS_VARIANTS: Record<OfferStatus, BadgeProps["variant"]> = {
  DRAFT: "outline",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "danger",
  EXPIRED: "warning",
  SUPERSEDED: "default",
};

async function transition(id: string, target: OfferStatus): Promise<void> {
  "use server";
  await transitionOffer(id, target);
}

export default async function OfferDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const offer = await prisma.offer.findUnique({
    where: { id: params.id },
    include: {
      request: {
        select: {
          id: true,
          equipmentType: true,
          lead: {
            select: {
              id: true,
              client: { select: { id: true, name: true } },
              companyName: true,
              contactName: true,
            },
          },
        },
      },
    },
  });
  if (!offer || offer.deletedAt) notFound();

  const editable = canEdit(user.role, CRM_EDITORS);
  const customer =
    offer.request.lead.client?.name ?? offer.request.lead.companyName ?? offer.request.lead.contactName ?? "—";

  const transitions: { label: string; target: OfferStatus; variant?: "default" | "success" | "destructive" }[] = [];
  switch (offer.status) {
    case OfferStatus.DRAFT:
      transitions.push({ label: "Göndərildi olaraq qeyd et", target: OfferStatus.SENT });
      break;
    case OfferStatus.SENT:
      transitions.push({ label: "Qəbul edildi", target: OfferStatus.ACCEPTED, variant: "success" });
      transitions.push({ label: "Rədd edildi", target: OfferStatus.REJECTED, variant: "destructive" });
      transitions.push({ label: "Vaxtı keçdi", target: OfferStatus.EXPIRED });
      break;
    default:
      break;
  }

  // Next-action banner based on offer.status
  let banner:
    | {
        variant: "info" | "success" | "warning" | "muted";
        title: string;
        description?: string;
        cta?: { label: string; href: string };
      }
    | null = null;
  switch (offer.status) {
    case OfferStatus.DRAFT:
      banner = {
        variant: "info",
        title: "Növbəti addım: təklifi müştəriyə göndərin.",
        description: "Aşağıdakı 'Göndərildi olaraq qeyd et' düyməsi ilə statusu dəyişin.",
      };
      break;
    case OfferStatus.SENT:
      banner = {
        variant: "warning",
        title: "Müştərinin cavabını gözləyirik.",
        description: "Cavab gələndə Qəbul / Rədd / Vaxtı keçdi olaraq qeyd edin.",
      };
      break;
    case OfferStatus.ACCEPTED:
      banner = {
        variant: "success",
        title: "Müştəri qəbul etdi! İndi müqavilə + əlavə yaradın.",
        description: "Səhifənin sonundakı 'MSA + Əlavə yarat' formundan istifadə edin.",
      };
      break;
    case OfferStatus.REJECTED:
      banner = { variant: "muted", title: "Təklif rədd edilib." };
      break;
    case OfferStatus.EXPIRED:
      banner = { variant: "muted", title: "Təklifin vaxtı keçib." };
      break;
    case OfferStatus.SUPERSEDED:
      banner = { variant: "muted", title: "Bu təklif əvəz edilib." };
      break;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Təklif v${offer.version} — ${offer.request.equipmentType}`}
        description={`Müştəri: ${customer}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/crm/requests/${offer.request.id}`}
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Sorğu
            </Link>
            {editable && offer.status === OfferStatus.DRAFT && (
              <Link href={`/crm/offers/${offer.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" /> Redaktə et
                </Button>
              </Link>
            )}
            {editable && (
              <form action={softDeleteOffer.bind(null, offer.id)}>
                <Button type="submit" variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" /> Sil
                </Button>
              </form>
            )}
          </div>
        }
      />

      <PipelineStepper
        currentStep="OFFER"
        links={{
          LEAD: `/crm/leads/${offer.request.lead.id}`,
          OFFER: `/crm/offers/${offer.id}`,
        }}
      />

      {banner && (
        <NextActionBanner
          variant={banner.variant}
          title={banner.title}
          description={banner.description}
          cta={banner.cta}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Şərtlər</CardTitle>
          <Badge variant={STATUS_VARIANTS[offer.status]}>{OFFER_STATUS_LABELS[offer.status]}</Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-slate-400">İcarə dövrü</dt>
              <dd>{RENTAL_PERIOD_TYPE_LABELS[offer.rentalPeriodType]}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Tarif</dt>
              <dd className="font-semibold">{fmtAzn(offer.baseFee)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Etibarlı tarix</dt>
              <dd>{offer.validUntil ? fmtDate(offer.validUntil) : <span className="text-slate-400">—</span>}</dd>
            </div>
            {offer.rentalPeriodType === "MONTHLY" && (
              <>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Ayda iş günü</dt>
                  <dd>{offer.baseDaysPerMonth ?? <span className="text-slate-400">—</span>}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase text-slate-400">Gündə iş saatı</dt>
                  <dd>{offer.baseHoursPerDay ?? <span className="text-slate-400">—</span>}</dd>
                </div>
              </>
            )}
            <div>
              <dt className="text-xs uppercase text-slate-400">Daşıma</dt>
              <dd>{TRANSPORT_RESPONSIBILITY_LABELS[offer.transportResponsibility]}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">ƏDV</dt>
              <dd>{VAT_TREATMENT_LABELS[offer.vatTreatment]}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Operator</dt>
              <dd>{offer.operatorIncluded ? "Daxildir" : "Daxil deyil"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Gecə növbəsi</dt>
              <dd>
                {offer.nightShift ? (
                  <Badge variant="warning">Bəli</Badge>
                ) : (
                  <span className="text-slate-500">Xeyr</span>
                )}
              </dd>
            </div>
            {offer.notes && (
              <div className="sm:col-span-3">
                <dt className="text-xs uppercase text-slate-400">Qeydlər</dt>
                <dd className="whitespace-pre-wrap">{offer.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sənəd</CardTitle>
        </CardHeader>
        <CardContent>
          <DocActions kind="offer" id={offer.id} token={offer.verifyToken} />
        </CardContent>
      </Card>

      {editable && transitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status keçidləri</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <form
                key={t.target}
                action={async () => {
                  "use server";
                  await transition(offer.id, t.target);
                }}
              >
                <Button
                  type="submit"
                  size="sm"
                  variant={t.variant === "destructive" ? "destructive" : t.variant === "success" ? "default" : "secondary"}
                >
                  {t.label}
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      )}

      {offer.status === OfferStatus.ACCEPTED && editable && (
        <ConvertSection offerId={offer.id} leadClientId={offer.request.lead.client?.id ?? null} />
      )}
    </div>
  );
}

async function ConvertSection({
  offerId,
  leadClientId,
}: {
  offerId: string;
  leadClientId: string | null;
}) {
  const [clients, equipment] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.equipment.findMany({
      where: { deletedAt: null, status: "AVAILABLE" },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);

  const suggested = `SKY${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>MSA + Əlavə yarat</CardTitle>
      </CardHeader>
      <CardContent>
        <ConvertPanel
          offerId={offerId}
          clients={clients.map((c) => ({ id: c.id, label: c.name }))}
          equipment={equipment.map((e) => ({ id: e.id, label: `${e.code} — ${e.name}` }))}
          defaultClientId={leadClientId ?? undefined}
          suggestedAgreementNumber={suggested}
        />
      </CardContent>
    </Card>
  );
}
