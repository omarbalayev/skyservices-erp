"use client";

import { useState } from "react";
import Link from "next/link";
import type { OfferStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OFFER_STATUS_LABELS } from "@/lib/enum-labels";
import { fmtAzn, fmtDate } from "@/lib/format";
import { addOffer } from "@/modules/offers/actions";
import OfferForm from "./offer-form";

type OfferRow = {
  id: string;
  version: number;
  status: OfferStatus;
  baseFee: string; // serialised Decimal
  validUntil: Date | null;
  createdAt: Date;
};

const STATUS_VARIANTS: Record<OfferStatus, BadgeProps["variant"]> = {
  DRAFT: "outline",
  SENT: "info",
  ACCEPTED: "success",
  REJECTED: "danger",
  EXPIRED: "warning",
  SUPERSEDED: "default",
};

export default function OffersPanel({
  requestId,
  offers,
}: {
  requestId: string;
  offers: OfferRow[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Təkliflər (TƏKLİF)</CardTitle>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            + Yeni təklif
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {offers.length === 0 && !showForm && (
          <p className="text-sm text-slate-500">Bu sorğu üçün təklif yoxdur.</p>
        )}

        {offers.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {offers.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <Link href={`/crm/offers/${o.id}`} className="text-brand-navy hover:underline">
                    Təklif v{o.version}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {fmtAzn(o.baseFee)}
                    {o.validUntil && <span> · Etibarlı: {fmtDate(o.validUntil)}</span>}
                    <span> · {fmtDate(o.createdAt)}</span>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANTS[o.status]}>{OFFER_STATUS_LABELS[o.status]}</Badge>
              </li>
            ))}
          </ul>
        )}

        {showForm && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <OfferForm
              action={async (fd) => addOffer(requestId, fd)}
              submitLabel="Təklif yarat"
              onSuccess={() => setShowForm(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
