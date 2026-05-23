import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import type { RequestStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireUser, CRM_EDITORS, canEdit } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { PipelineStepper } from "@/components/pipeline-stepper";
import { NextActionBanner } from "@/components/next-action-banner";
import { fmtDate } from "@/lib/format";
import {
  DELIVERY_RESPONSIBILITY_LABELS,
  LEAD_SOURCE_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/lib/enum-labels";
import { softDeleteRequest } from "@/modules/leads/actions";
import OffersPanel from "./offers-panel";

const STATUS_VARIANTS: Record<RequestStatus, BadgeProps["variant"]> = {
  OPEN: "info",
  QUOTED: "warning",
  REJECTED: "danger",
  CONVERTED: "success",
};

export default async function RequestDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { newOffer?: string };
}) {
  const user = await requireUser();
  const req = await prisma.request.findUnique({
    where: { id: params.id },
    include: {
      lead: {
        select: {
          id: true,
          source: true,
          client: {
            select: {
              id: true,
              name: true,
              contacts: {
                where: { isPrimary: true },
                select: { name: true, phone: true, email: true },
                take: 1,
              },
            },
          },
          companyName: true,
          contactName: true,
          contactPhone: true,
          contactEmail: true,
        },
      },
      offers: {
        where: { deletedAt: null },
        orderBy: { version: "desc" },
        select: { id: true, version: true, status: true, baseFee: true, validUntil: true, createdAt: true },
      },
    },
  });
  if (!req || req.deletedAt) notFound();

  const editable = canEdit(user.role, CRM_EDITORS);
  const customerDisplay =
    req.lead.client?.name ?? req.lead.companyName ?? req.lead.contactName ?? "—";

  // Latest offer drives the next-action banner.
  const latestOffer = req.offers[0]; // sorted by version desc
  let banner:
    | {
        variant: "info" | "success" | "warning" | "muted";
        title: string;
        description?: string;
        cta?: { label: string; href: string };
      }
    | null = null;
  if (req.status === "REJECTED") {
    banner = { variant: "muted", title: "Sorğu rədd edilib." };
  } else if (req.status === "CONVERTED") {
    banner = { variant: "success", title: "Sorğu icarəyə çevrilib." };
  } else if (!latestOffer) {
    banner = {
      variant: "info",
      title: "Növbəti addım: bu sorğu üçün təklif hazırlayın.",
      description: "Aşağıdakı 'Yeni təklif' düyməsi ilə qiyməti və şərtləri qeyd edin.",
    };
  } else if (latestOffer.status === "DRAFT") {
    banner = {
      variant: "info",
      title: "Təklif qaralamadadır — yekunlaşdırıb göndərin.",
      cta: { label: "Təklifə keç", href: `/crm/offers/${latestOffer.id}` },
    };
  } else if (latestOffer.status === "SENT") {
    banner = {
      variant: "warning",
      title: "Müştəriyə təklif göndərilib — cavab gözlənilir.",
      cta: { label: "Təklifə keç", href: `/crm/offers/${latestOffer.id}` },
    };
  } else if (latestOffer.status === "ACCEPTED") {
    banner = {
      variant: "success",
      title: "Müştəri qəbul etdi — müqavilə + əlavə yaradın.",
      cta: { label: "Təklifə keç", href: `/crm/offers/${latestOffer.id}` },
    };
  } else if (latestOffer.status === "REJECTED") {
    banner = { variant: "muted", title: "Təklif rədd edilib. Yeni təklif hazırlamaq olar." };
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={req.equipmentType}
        description={`Müraciət: ${customerDisplay}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/crm/leads/${req.lead.id}`}
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Müraciətə qayıt
            </Link>
            {editable && (
              <Link href={`/crm/requests/${req.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" /> Redaktə et
                </Button>
              </Link>
            )}
            {editable && (
              <form action={softDeleteRequest.bind(null, req.id)}>
                <Button type="submit" variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" /> Sil
                </Button>
              </form>
            )}
          </div>
        }
      />

      <PipelineStepper
        currentStep="LEAD"
        links={{
          LEAD: `/crm/leads/${req.lead.id}`,
          ...(latestOffer && { OFFER: `/crm/offers/${latestOffer.id}` }),
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
          <CardTitle>Kontakt</CardTitle>
          <span className="text-xs text-slate-500">
            Mənbə: {LEAD_SOURCE_LABELS[req.lead.source]}
          </span>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-slate-400">Müştəri</dt>
              <dd>
                {req.lead.client ? (
                  <Link
                    href={`/crm/clients/${req.lead.client.id}`}
                    className="font-medium text-brand-navy hover:underline"
                  >
                    {req.lead.client.name}
                  </Link>
                ) : req.lead.companyName ? (
                  <span className="font-medium text-slate-900">{req.lead.companyName}</span>
                ) : (
                  <span className="text-slate-400">— (veb sorğu)</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Əlaqədar şəxs</dt>
              <dd>
                {req.lead.client?.contacts[0]?.name ??
                  req.lead.contactName ?? <span className="text-slate-400">—</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Telefon</dt>
              <dd>
                {req.lead.client?.contacts[0]?.phone ??
                  req.lead.contactPhone ?? <span className="text-slate-400">—</span>}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-slate-400">Email</dt>
              <dd>
                {req.lead.client?.contacts[0]?.email ??
                  req.lead.contactEmail ?? <span className="text-slate-400">—</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Tarixçə</dt>
              <dd>
                <Link
                  href={`/crm/leads/${req.lead.id}`}
                  className="text-brand-navy hover:underline"
                >
                  Bu kontaktın bütün sorğuları
                </Link>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sorğu məlumatları</CardTitle>
          <Badge variant={STATUS_VARIANTS[req.status]}>{REQUEST_STATUS_LABELS[req.status]}</Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-slate-400">Texnika</dt>
              <dd>{req.equipmentType}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">İş hündürlüyü</dt>
              <dd>
                {req.workingHeightMeters
                  ? `${req.workingHeightMeters.toString()} m`
                  : <span className="text-slate-400">—</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">İcarə dövrü</dt>
              <dd>
                {fmtDate(req.rentalStart)} → {fmtDate(req.rentalEnd)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Ərazi</dt>
              <dd>{req.usageZone ?? <span className="text-slate-400">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Daşıma</dt>
              <dd>{DELIVERY_RESPONSIBILITY_LABELS[req.deliveryResponsibility]}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Operator</dt>
              <dd>{req.operatorNeeded ? "Tələb olunur" : "Tələb olunmur"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Gecə növbəsi</dt>
              <dd>
                {req.nightShift ? (
                  <Badge variant="warning">Bəli</Badge>
                ) : (
                  <span className="text-slate-500">Xeyr</span>
                )}
              </dd>
            </div>
            {req.notes && (
              <div className="sm:col-span-3">
                <dt className="text-xs uppercase text-slate-400">Qeydlər</dt>
                <dd className="whitespace-pre-wrap">{req.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <OffersPanel
        requestId={req.id}
        defaultOpen={searchParams?.newOffer === "1"}
        offers={req.offers.map((o) => ({
          id: o.id,
          version: o.version,
          status: o.status,
          baseFee: o.baseFee.toString(),
          validUntil: o.validUntil,
          createdAt: o.createdAt,
        }))}
      />
    </div>
  );
}
