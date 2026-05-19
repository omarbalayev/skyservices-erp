import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import {
  AddendumStatus,
  type AddendumKind,
  type LeadStatus,
  type MasterAgreementStatus,
  type OfferStatus,
  type RequestStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireUser, CRM_EDITORS, canEdit } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { fmtAzn, fmtDate } from "@/lib/format";
import {
  ADDENDUM_KIND_LABELS,
  ADDENDUM_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  MSA_STATUS_LABELS,
  OFFER_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
} from "@/lib/enum-labels";
import { softDeleteClient } from "@/modules/clients/actions";
import ContactsPanel from "./contacts-panel";

const MSA_STATUS_VARIANTS: Record<MasterAgreementStatus, BadgeProps["variant"]> = {
  DRAFT: "outline",
  SIGNED: "info",
  ACTIVE: "success",
  EXPIRED: "warning",
  TERMINATED: "danger",
};
const ADD_STATUS_VARIANTS: Record<AddendumStatus, BadgeProps["variant"]> = {
  DRAFT: "outline",
  SIGNED: "info",
  ACTIVE: "success",
  SUPERSEDED: "default",
};
const LEAD_STATUS_VARIANTS: Record<LeadStatus, BadgeProps["variant"]> = {
  NEW: "info",
  WORKING: "warning",
  LOST: "danger",
  CONVERTED: "success",
};
const REQUEST_STATUS_VARIANTS: Record<RequestStatus, BadgeProps["variant"]> = {
  OPEN: "info",
  QUOTED: "warning",
  REJECTED: "danger",
  CONVERTED: "success",
};
const OFFER_STATUS_VARIANTS: Record<OfferStatus, BadgeProps["variant"]> = {
  DRAFT: "outline",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "danger",
  EXPIRED: "warning",
  SUPERSEDED: "default",
};

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      contacts: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { name: "asc" }] },
      masterAgreement: {
        include: {
          addendums: {
            where: { deletedAt: null },
            orderBy: { addendumNumber: "asc" },
            include: {
              _count: { select: { equipmentLines: true } },
              equipmentLines: {
                include: { equipment: { select: { id: true, code: true, name: true } } },
              },
            },
          },
        },
      },
      leads: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          owner: { select: { name: true } },
          requests: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, equipmentType: true, status: true },
          },
        },
      },
      _count: { select: { leads: { where: { deletedAt: null } } } },
    },
  });
  if (!client || client.deletedAt) notFound();

  const editable = canEdit(user.role, CRM_EDITORS);

  // Aggregate: recent offers across all requests on this client's leads (last 5).
  const recentOffers = await prisma.offer.findMany({
    where: {
      deletedAt: null,
      request: { lead: { clientId: client.id, deletedAt: null } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      request: { select: { id: true, equipmentType: true } },
    },
  });

  // Active rentals = AddendumEquipment lines on ACTIVE addendums, with endedAt null/future.
  const activeRentals = client.masterAgreement
    ? client.masterAgreement.addendums
        .filter((a) => a.status === AddendumStatus.ACTIVE)
        .flatMap((a) =>
          a.equipmentLines
            .filter((l) => !l.endedAt || l.endedAt > new Date())
            .map((l) => ({
              line: l,
              addendum: {
                id: a.id,
                addendumNumber: a.addendumNumber,
                masterAgreementId: a.masterAgreementId,
              },
            })),
        )
    : [];

  const pendingOffersCount = recentOffers.filter(
    (o) => o.status === "DRAFT" || o.status === "SENT",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={client.voen ? `VÖEN: ${client.voen}` : "VÖEN qeyd edilməyib"}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/crm/clients"
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Siyahı
            </Link>
            {editable && (
              <Link href={`/crm/clients/${client.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" /> Redaktə et
                </Button>
              </Link>
            )}
            {editable && (
              <form action={softDeleteClient.bind(null, client.id)}>
                <Button type="submit" variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" /> Sil
                </Button>
              </form>
            )}
          </div>
        }
      />

      {/* Quick-stats strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Aktiv icarələr" value={activeRentals.length} />
        <StatCard
          label="MSA"
          value={
            client.masterAgreement ? (
              <Badge variant={MSA_STATUS_VARIANTS[client.masterAgreement.status]}>
                {client.masterAgreement.agreementNumber}
              </Badge>
            ) : (
              <span className="text-slate-400">Yoxdur</span>
            )
          }
        />
        <StatCard label="Müraciətlər" value={client._count.leads} />
        <StatCard label="Açıq təkliflər" value={pendingOffersCount} />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Client info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Müştəri məlumatları</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-slate-400">Ad</dt>
                <dd className="text-slate-900">{client.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">VÖEN</dt>
                <dd>{client.voen ?? <span className="text-slate-400">—</span>}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">Yaradılma</dt>
                <dd>{fmtDate(client.createdAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase text-slate-400">Hesab-faktura ünvanı</dt>
                <dd className="whitespace-pre-wrap">
                  {client.billingAddress ?? <span className="text-slate-400">—</span>}
                </dd>
              </div>
              {client.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase text-slate-400">Qeydlər</dt>
                  <dd className="whitespace-pre-wrap">{client.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Əlaqələr</CardTitle>
          </CardHeader>
          <CardContent>
            {editable ? (
              <ContactsPanel clientId={client.id} contacts={client.contacts} />
            ) : client.contacts.length === 0 ? (
              <p className="text-sm text-slate-500">Bu müştəri üçün heç bir əlaqə yoxdur.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {client.contacts.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium">{c.name}</span>
                    {c.position && <span className="text-slate-500"> — {c.position}</span>}
                    {c.phone && <span className="text-slate-500"> · {c.phone}</span>}
                    {c.email && <span className="text-slate-500"> · {c.email}</span>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active rentals */}
      <Card>
        <CardHeader>
          <CardTitle>Aktiv icarələr</CardTitle>
          {client.masterAgreement && (
            <span className="text-xs text-slate-500">
              MSA: {client.masterAgreement.agreementNumber}
            </span>
          )}
        </CardHeader>
        <CardContent>
          {activeRentals.length === 0 ? (
            <p className="text-sm text-slate-500">Hazırda aktiv icarə yoxdur.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {activeRentals.map(({ line, addendum }) => (
                <li key={line.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                  <div>
                    <Link
                      href={`/fleet/${line.equipment.id}`}
                      className="font-mono text-brand-navy hover:underline"
                    >
                      {line.equipment.code}
                    </Link>{" "}
                    <span className="text-slate-700">{line.equipment.name}</span>
                    <div className="text-xs text-slate-500">
                      Əlavə {addendum.addendumNumber} · {fmtAzn(line.baseFee)}
                      {(line.startedAt || line.endedAt) && (
                        <>
                          {" · "}
                          {fmtDate(line.startedAt)} → {fmtDate(line.endedAt)}
                        </>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/crm/agreements/${addendum.masterAgreementId}/addendums/${addendum.id}`}
                    className="text-xs text-slate-500 hover:text-slate-900"
                  >
                    Əlavəyə keç →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* MSA + addendums */}
      <Card>
        <CardHeader>
          <CardTitle>Müqavilə (MSA) və əlavələr</CardTitle>
          {editable && client.masterAgreement && (
            <Link
              href={`/crm/agreements/${client.masterAgreement.id}/addendums/new`}
            >
              <Button size="sm" variant="secondary">
                <Plus className="h-4 w-4" /> Yeni əlavə
              </Button>
            </Link>
          )}
          {editable && !client.masterAgreement && (
            <Link href="/crm/agreements/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Müqavilə yarat
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {!client.masterAgreement ? (
            <p className="text-sm text-slate-500">Hələ MSA yoxdur.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Link
                  href={`/crm/agreements/${client.masterAgreement.id}`}
                  className="font-mono text-sm text-brand-navy hover:underline"
                >
                  {client.masterAgreement.agreementNumber}
                </Link>
                <Badge variant={MSA_STATUS_VARIANTS[client.masterAgreement.status]}>
                  {MSA_STATUS_LABELS[client.masterAgreement.status]}
                </Badge>
              </div>
              {client.masterAgreement.addendums.length === 0 ? (
                <p className="text-xs text-slate-500">Əlavə yoxdur.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {client.masterAgreement.addendums.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-start justify-between gap-3 py-2 text-sm"
                    >
                      <div>
                        <Link
                          href={`/crm/agreements/${a.masterAgreementId}/addendums/${a.id}`}
                          className="font-medium text-brand-navy hover:underline"
                        >
                          Əlavə {a.addendumNumber}
                        </Link>{" "}
                        <span className="text-slate-500">
                          — {ADDENDUM_KIND_LABELS[a.kind as AddendumKind]}
                        </span>
                        <div className="text-xs text-slate-500">
                          {a._count.equipmentLines} texnika ·{" "}
                          {fmtDate(a.effectiveFrom)} → {fmtDate(a.effectiveTo)}
                        </div>
                      </div>
                      <Badge variant={ADD_STATUS_VARIANTS[a.status]}>
                        {ADDENDUM_STATUS_LABELS[a.status]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent leads */}
      <Card>
        <CardHeader>
          <CardTitle>Son müraciətlər</CardTitle>
          {editable && (
            <Link href={`/crm/leads/new?clientId=${client.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4" /> Yeni müraciət
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {client.leads.length === 0 ? (
            <p className="text-sm text-slate-500">Müraciət yoxdur.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {client.leads.map((l) => {
                const firstReq = l.requests[0];
                return (
                  <li key={l.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <Link
                        href={`/crm/leads/${l.id}`}
                        className="font-medium text-brand-navy hover:underline"
                      >
                        {firstReq?.equipmentType ?? "(sorğu yoxdur)"}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {l.owner?.name ? `Məsul: ${l.owner.name} · ` : null}
                        {fmtDate(l.createdAt)}
                        {firstReq && (
                          <>
                            {" · "}
                            <Badge variant={REQUEST_STATUS_VARIANTS[firstReq.status]}>
                              {REQUEST_STATUS_LABELS[firstReq.status]}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge variant={LEAD_STATUS_VARIANTS[l.status]}>
                      {LEAD_STATUS_LABELS[l.status]}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Recent offers */}
      <Card>
        <CardHeader>
          <CardTitle>Son təkliflər</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOffers.length === 0 ? (
            <p className="text-sm text-slate-500">Hələ təklif verilməyib.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentOffers.map((o) => (
                <li key={o.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                  <div>
                    <Link
                      href={`/crm/offers/${o.id}`}
                      className="font-medium text-brand-navy hover:underline"
                    >
                      {o.request.equipmentType} · v{o.version}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {fmtAzn(o.baseFee)} · {fmtDate(o.createdAt)}
                    </div>
                  </div>
                  <Badge variant={OFFER_STATUS_VARIANTS[o.status]}>
                    {OFFER_STATUS_LABELS[o.status]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
