import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import type { EquipmentStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireUser, EQUIPMENT_EDITORS, canEdit } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { fmtDate } from "@/lib/format";
import { EQUIPMENT_STATUS_LABELS } from "@/lib/enum-labels";
import { softDeleteEquipment } from "@/modules/equipment/actions";

const STATUS_VARIANTS: Record<EquipmentStatus, BadgeProps["variant"]> = {
  AVAILABLE: "success",
  RESERVED: "info",
  ON_RENT: "warning",
  IN_TRANSIT: "info",
  IN_REPAIR: "warning",
  OUT_OF_SERVICE: "danger",
};

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const eq = await prisma.equipment.findUnique({ where: { id: params.id } });
  if (!eq || eq.deletedAt) notFound();

  const editable = canEdit(user.role, EQUIPMENT_EDITORS);

  return (
    <div className="space-y-4">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            <span className="font-mono text-slate-500">{eq.code}</span>
            <span>{eq.name}</span>
          </span>
        }
        description={eq.type}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/fleet"
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Siyahı
            </Link>
            {editable && (
              <Link href={`/fleet/${eq.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Pencil className="h-4 w-4" />
                  Redaktə et
                </Button>
              </Link>
            )}
            {editable && (
              <form action={softDeleteEquipment.bind(null, eq.id)}>
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
          <CardTitle>Texniki məlumatlar</CardTitle>
          <Badge variant={STATUS_VARIANTS[eq.status]}>{EQUIPMENT_STATUS_LABELS[eq.status]}</Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs uppercase text-slate-400">Kod</dt>
              <dd className="font-mono">{eq.code}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Növ</dt>
              <dd>{eq.type}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">İstehsal ili</dt>
              <dd>{eq.year ?? <span className="text-slate-400">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">İstehsalçı</dt>
              <dd>{eq.manufacturer ?? <span className="text-slate-400">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Model</dt>
              <dd>{eq.model ?? <span className="text-slate-400">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Seriya (S/N)</dt>
              <dd>{eq.serial ?? <span className="text-slate-400">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">DQN</dt>
              <dd>{eq.dqn ?? <span className="text-slate-400">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Yerləşdiyi ərazi</dt>
              <dd>{eq.currentLocation ?? <span className="text-slate-400">—</span>}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Yaradılma</dt>
              <dd>{fmtDate(eq.createdAt)}</dd>
            </div>
            {eq.cmsProductUrl && (
              <div className="sm:col-span-3">
                <dt className="text-xs uppercase text-slate-400">Texniki spesifikasiya</dt>
                <dd>
                  <a
                    href={eq.cmsProductUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-navy underline"
                  >
                    skyservices.az məhsul səhifəsi →
                  </a>
                </dd>
              </div>
            )}
            {eq.notes && (
              <div className="sm:col-span-3">
                <dt className="text-xs uppercase text-slate-400">Qeydlər</dt>
                <dd className="whitespace-pre-wrap">{eq.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <p className="text-xs text-slate-400">
        Detallı texnika modulu (parçalar, sertifikatlar, motor saatları, status logu) Phase 2-də əlavə
        olunacaq.
      </p>
    </div>
  );
}
