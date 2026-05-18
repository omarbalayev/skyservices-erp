import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { AddendumStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireUser, CRM_EDITORS, canEdit } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { fmtDate } from "@/lib/format";
import { ADDENDUM_KIND_LABELS, ADDENDUM_STATUS_LABELS } from "@/lib/enum-labels";
import {
  softDeleteAddendum,
  transitionAddendum,
} from "@/modules/agreements/actions";
import EquipmentLinesPanel from "./equipment-panel";
import DocActions from "@/components/doc-actions";

const STATUS_VARIANTS: Record<AddendumStatus, BadgeProps["variant"]> = {
  DRAFT: "outline",
  SIGNED: "info",
  ACTIVE: "success",
  SUPERSEDED: "default",
};

export default async function AddendumDetailPage({
  params,
}: {
  params: { id: string; addid: string };
}) {
  const user = await requireUser();
  const addendum = await prisma.addendum.findUnique({
    where: { id: params.addid },
    include: {
      masterAgreement: { select: { id: true, agreementNumber: true, client: { select: { name: true } } } },
      offer: { select: { id: true, version: true } },
      equipmentLines: {
        include: { equipment: { select: { id: true, code: true, name: true } } },
      },
    },
  });
  if (!addendum || addendum.deletedAt) notFound();
  if (addendum.masterAgreementId !== params.id) notFound();

  const allEquipment = await prisma.equipment.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true },
  });

  const editable = canEdit(user.role, CRM_EDITORS);

  const transitions: { label: string; target: AddendumStatus; variant?: "default" | "destructive" }[] = [];
  switch (addendum.status) {
    case AddendumStatus.DRAFT:
      transitions.push({ label: "İmzalandı olaraq qeyd et", target: AddendumStatus.SIGNED });
      break;
    case AddendumStatus.SIGNED:
      transitions.push({ label: "Aktivləşdir", target: AddendumStatus.ACTIVE });
      break;
    default:
      break;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Əlavə ${addendum.addendumNumber} — ${ADDENDUM_KIND_LABELS[addendum.kind]}`}
        description={`MSA: ${addendum.masterAgreement.agreementNumber} · ${addendum.masterAgreement.client.name}`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`/crm/agreements/${addendum.masterAgreementId}`}
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> MSA
            </Link>
            {editable && addendum.status === AddendumStatus.DRAFT && (
              <Link
                href={`/crm/agreements/${addendum.masterAgreementId}/addendums/${addendum.id}/edit`}
              >
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" /> Redaktə et
                </Button>
              </Link>
            )}
            {editable && (
              <form action={softDeleteAddendum.bind(null, addendum.id)}>
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
          <CardTitle>Əlavə məlumatları</CardTitle>
          <Badge variant={STATUS_VARIANTS[addendum.status]}>{ADDENDUM_STATUS_LABELS[addendum.status]}</Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-slate-400">Növ</dt>
              <dd>{ADDENDUM_KIND_LABELS[addendum.kind]}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Bağlı təklif</dt>
              <dd>
                {addendum.offer ? (
                  <Link href={`/crm/offers/${addendum.offer.id}`} className="text-brand-navy underline">
                    Təklif v{addendum.offer.version}
                  </Link>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Etibarlılıq</dt>
              <dd>
                {fmtDate(addendum.effectiveFrom)} → {fmtDate(addendum.effectiveTo)}
              </dd>
            </div>
            {addendum.notes && (
              <div className="sm:col-span-3">
                <dt className="text-xs uppercase text-slate-400">Qeydlər</dt>
                <dd className="whitespace-pre-wrap">{addendum.notes}</dd>
              </div>
            )}
          </dl>
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
                  await transitionAddendum(addendum.id, t.target);
                }}
              >
                <Button type="submit" size="sm" variant={t.variant === "destructive" ? "destructive" : "default"}>
                  {t.label}
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sənəd</CardTitle>
        </CardHeader>
        <CardContent>
          <DocActions kind="addendum" id={addendum.id} token={addendum.verifyToken} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Texnika sətirləri</CardTitle>
        </CardHeader>
        <CardContent>
          <EquipmentLinesPanel
            addendumId={addendum.id}
            lines={addendum.equipmentLines.map((l) => ({
              id: l.id,
              equipmentId: l.equipmentId,
              equipmentCode: l.equipment.code,
              equipmentName: l.equipment.name,
              rentalPeriodType: l.rentalPeriodType,
              baseDaysPerMonth: l.baseDaysPerMonth,
              baseHoursPerDay: l.baseHoursPerDay,
              baseFee: l.baseFee.toString(),
              belowBaselineRule: l.belowBaselineRule,
              operatorIncluded: l.operatorIncluded,
              transportResponsibility: l.transportResponsibility,
              vatTreatment: l.vatTreatment,
              startedAt: l.startedAt,
              endedAt: l.endedAt,
            }))}
            availableEquipment={allEquipment.map((e) => ({
              id: e.id,
              label: `${e.code} — ${e.name}`,
            }))}
            editable={editable}
          />
        </CardContent>
      </Card>
    </div>
  );
}
