import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import type { LeadStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireUser, CRM_EDITORS, canEdit } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { fmtDate } from "@/lib/format";
import { LEAD_LOST_REASON_LABELS, LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from "@/lib/enum-labels";
import { softDeleteLead } from "@/modules/leads/actions";
import RequestsPanel from "./requests-panel";

const STATUS_VARIANTS: Record<LeadStatus, BadgeProps["variant"]> = {
  NEW: "info",
  WORKING: "warning",
  LOST: "danger",
  CONVERTED: "success",
};

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      client: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
      requests: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          equipmentType: true,
          rentalStart: true,
          rentalEnd: true,
          usageZone: true,
          operatorNeeded: true,
          nightShift: true,
          createdAt: true,
          _count: { select: { offers: { where: { deletedAt: null } } } },
        },
      },
    },
  });
  if (!lead || lead.deletedAt) notFound();

  const editable = canEdit(user.role, CRM_EDITORS);
  const displayName = lead.client?.name ?? lead.companyName ?? lead.contactName ?? "Adı yox";

  return (
    <div className="space-y-4">
      <PageHeader
        title={displayName}
        description={lead.client ? `Mövcud müştəri: ${lead.client.name}` : "Yeni potensial müştəri"}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/crm/leads"
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Siyahı
            </Link>
            {editable && (
              <Link href={`/crm/leads/${lead.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" />
                  Redaktə et
                </Button>
              </Link>
            )}
            {editable && (
              <form action={softDeleteLead.bind(null, lead.id)}>
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
          <CardTitle>Müraciət məlumatları</CardTitle>
          <Badge variant={STATUS_VARIANTS[lead.status]}>{LEAD_STATUS_LABELS[lead.status]}</Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-slate-400">Mənbə</dt>
              <dd>{LEAD_SOURCE_LABELS[lead.source]}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Məsul</dt>
              <dd>{lead.owner?.name ?? <span className="text-slate-400">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Yaradılma</dt>
              <dd>{fmtDate(lead.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Şirkət (raw)</dt>
              <dd>{lead.companyName ?? <span className="text-slate-400">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Əlaqədar şəxs</dt>
              <dd>{lead.contactName ?? <span className="text-slate-400">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Telefon / Email</dt>
              <dd>
                {lead.contactPhone || lead.contactEmail
                  ? [lead.contactPhone, lead.contactEmail].filter(Boolean).join(" · ")
                  : "—"}
              </dd>
            </div>
            {lead.description && (
              <div className="sm:col-span-3">
                <dt className="text-xs uppercase text-slate-400">Təfərrüat</dt>
                <dd className="whitespace-pre-wrap">{lead.description}</dd>
              </div>
            )}
            {lead.status === "LOST" && (
              <div className="sm:col-span-3 rounded-md bg-red-50 p-3">
                <dt className="text-xs uppercase text-red-600">İtirilmə səbəbi</dt>
                <dd>
                  {lead.lostReason ? LEAD_LOST_REASON_LABELS[lead.lostReason] : "—"}
                  {lead.lostNote && <span className="text-slate-700"> — {lead.lostNote}</span>}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sorğular (SORĞU)</CardTitle>
        </CardHeader>
        <CardContent>
          {editable ? (
            <RequestsPanel
              leadId={lead.id}
              requests={lead.requests.map((r) => ({
                id: r.id,
                status: r.status,
                equipmentType: r.equipmentType,
                rentalStart: r.rentalStart,
                rentalEnd: r.rentalEnd,
                usageZone: r.usageZone,
                operatorNeeded: r.operatorNeeded,
                nightShift: r.nightShift,
                createdAt: r.createdAt,
                offerCount: r._count.offers,
              }))}
            />
          ) : lead.requests.length === 0 ? (
            <p className="text-sm text-slate-500">Sorğu yoxdur.</p>
          ) : (
            <ul className="text-sm">
              {lead.requests.map((r) => (
                <li key={r.id}>
                  <Link href={`/crm/requests/${r.id}`} className="text-brand-navy hover:underline">
                    {r.equipmentType}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
