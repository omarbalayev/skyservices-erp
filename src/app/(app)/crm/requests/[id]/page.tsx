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
import { fmtDate } from "@/lib/format";
import { DELIVERY_RESPONSIBILITY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/enum-labels";
import { softDeleteRequest } from "@/modules/leads/actions";
import OffersPanel from "./offers-panel";

const STATUS_VARIANTS: Record<RequestStatus, BadgeProps["variant"]> = {
  OPEN: "info",
  QUOTED: "warning",
  REJECTED: "danger",
  CONVERTED: "success",
};

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const req = await prisma.request.findUnique({
    where: { id: params.id },
    include: {
      lead: {
        select: { id: true, client: { select: { id: true, name: true } }, companyName: true, contactName: true },
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
