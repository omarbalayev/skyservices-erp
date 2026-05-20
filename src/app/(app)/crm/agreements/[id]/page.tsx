import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import type { AddendumKind, AddendumStatus, MasterAgreementStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireUser, CRM_EDITORS, canEdit } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { PipelineStepper } from "@/components/pipeline-stepper";
import { NextActionBanner } from "@/components/next-action-banner";
import { fmtDate } from "@/lib/format";
import { ADDENDUM_KIND_LABELS, ADDENDUM_STATUS_LABELS, MSA_STATUS_LABELS } from "@/lib/enum-labels";
import { softDeleteMasterAgreement } from "@/modules/agreements/actions";
import DocActions from "@/components/doc-actions";

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

export default async function MsaDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const msa = await prisma.masterAgreement.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      addendums: {
        where: { deletedAt: null },
        orderBy: { addendumNumber: "asc" },
        include: { _count: { select: { equipmentLines: true } } },
      },
    },
  });
  if (!msa || msa.deletedAt) notFound();

  const editable = canEdit(user.role, CRM_EDITORS);

  const draftAddendum = msa.addendums.find((a) => a.status === "DRAFT");
  const activeAddendum = msa.addendums.find((a) => a.status === "ACTIVE");
  const hasActive = !!activeAddendum;

  let banner:
    | {
        variant: "info" | "success" | "warning" | "muted";
        title: string;
        description?: string;
        cta?: { label: string; href: string };
      }
    | null = null;
  if (msa.status === "DRAFT") {
    banner = {
      variant: "info",
      title: "Növbəti addım: müqaviləni imzalandığı tarixdə qeyd edin.",
      cta: { label: "Redaktə et", href: `/crm/agreements/${msa.id}/edit` },
    };
  } else if (msa.status === "TERMINATED") {
    banner = { variant: "muted", title: "Müqavilə ləğv edilib." };
  } else if (msa.status === "EXPIRED") {
    banner = { variant: "muted", title: "Müqavilənin müddəti bitib." };
  } else if (msa.addendums.length === 0) {
    banner = {
      variant: "info",
      title: "Növbəti addım: ilk əlavə yaradın.",
      cta: { label: "Yeni əlavə", href: `/crm/agreements/${msa.id}/addendums/new` },
    };
  } else if (draftAddendum) {
    banner = {
      variant: "info",
      title: "Yeni əlavə qaralamadadır — imzalayıb aktivləşdirin.",
      cta: {
        label: `Əlavə ${draftAddendum.addendumNumber}`,
        href: `/crm/agreements/${msa.id}/addendums/${draftAddendum.id}`,
      },
    };
  } else if (hasActive) {
    banner = { variant: "success", title: "Aktiv müqavilə." };
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={msa.agreementNumber}
        description={msa.client.name}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/crm/agreements"
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Siyahı
            </Link>
            {editable && (
              <Link href={`/crm/agreements/${msa.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" /> Redaktə et
                </Button>
              </Link>
            )}
            {editable && (
              <form action={softDeleteMasterAgreement.bind(null, msa.id)}>
                <Button type="submit" variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4" /> Sil
                </Button>
              </form>
            )}
          </div>
        }
      />

      <PipelineStepper
        currentStep={hasActive ? "ACTIVE" : "CONTRACT"}
        links={{
          LEAD: `/crm/clients/${msa.clientId}`,
          CONTRACT: `/crm/agreements/${msa.id}`,
          ...(activeAddendum && {
            ACTIVE: `/crm/agreements/${msa.id}/addendums/${activeAddendum.id}`,
          }),
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
          <CardTitle>Müqavilə məlumatları</CardTitle>
          <Badge variant={MSA_STATUS_VARIANTS[msa.status]}>{MSA_STATUS_LABELS[msa.status]}</Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-slate-400">Müqavilə №</dt>
              <dd className="font-mono">{msa.agreementNumber}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Müştəri</dt>
              <dd>
                <Link href={`/crm/clients/${msa.client.id}`} className="text-brand-navy underline">
                  {msa.client.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Avto. yenilənmə</dt>
              <dd>{msa.autoRenew ? "Bəli" : "Xeyr"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">İmzalanma</dt>
              <dd>{fmtDate(msa.signedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Etibarlı (başlama)</dt>
              <dd>{fmtDate(msa.effectiveFrom)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Etibarlı (bitmə)</dt>
              <dd>{fmtDate(msa.effectiveTo)}</dd>
            </div>
            {msa.notes && (
              <div className="sm:col-span-3">
                <dt className="text-xs uppercase text-slate-400">Qeydlər</dt>
                <dd className="whitespace-pre-wrap">{msa.notes}</dd>
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
          <DocActions kind="msa" id={msa.id} token={msa.verifyToken} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Əlavələr (Addendum)</CardTitle>
          {editable && (
            <Link href={`/crm/agreements/${msa.id}/addendums/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4" /> Yeni əlavə
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {msa.addendums.length === 0 ? (
            <p className="text-sm text-slate-500">Hələ əlavə yoxdur.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {msa.addendums.map((a) => (
                <li key={a.id} className="py-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/crm/agreements/${msa.id}/addendums/${a.id}`}
                        className="font-medium text-brand-navy hover:underline"
                      >
                        Əlavə {a.addendumNumber} — {ADDENDUM_KIND_LABELS[a.kind as AddendumKind]}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <Badge variant={ADD_STATUS_VARIANTS[a.status]}>
                          {ADDENDUM_STATUS_LABELS[a.status]}
                        </Badge>
                        {(a.effectiveFrom || a.effectiveTo) && (
                          <span>
                            {fmtDate(a.effectiveFrom)} → {fmtDate(a.effectiveTo)}
                          </span>
                        )}
                        <span>· {a._count.equipmentLines} texnika sətri</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{fmtDate(a.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
