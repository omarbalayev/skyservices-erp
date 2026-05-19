"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { DeliveryResponsibility, RequestStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { FormField } from "@/components/form-field";
import { addRequest } from "@/modules/leads/actions";
import { DELIVERY_RESPONSIBILITY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/enum-labels";
import { fmtDate } from "@/lib/format";

type ReqRow = {
  id: string;
  status: RequestStatus;
  equipmentType: string;
  rentalStart: Date | null;
  rentalEnd: Date | null;
  usageZone: string | null;
  operatorNeeded: boolean;
  nightShift: boolean;
  createdAt: Date;
  offerCount: number;
};

const STATUS_VARIANTS: Record<RequestStatus, BadgeProps["variant"]> = {
  OPEN: "info",
  QUOTED: "warning",
  REJECTED: "danger",
  CONVERTED: "success",
};

export default function RequestsPanel({
  leadId,
  requests,
}: {
  leadId: string;
  requests: ReqRow[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget; // capture before await
    setSubmitting(true);
    setError(null);
    const result = await addRequest(leadId, new FormData(formEl));
    setSubmitting(false);
    if (result?.ok === false) {
      setError(result.error);
    } else {
      formEl.reset();
      setShowForm(false);
    }
  }

  return (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <p className="text-sm text-slate-500">Bu müraciət üçün sorğu yoxdur.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {requests.map((r) => (
            <li key={r.id} className="py-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/crm/requests/${r.id}`}
                    className="font-medium text-brand-navy hover:underline"
                  >
                    {r.equipmentType}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge variant={STATUS_VARIANTS[r.status]}>{REQUEST_STATUS_LABELS[r.status]}</Badge>
                    {(r.rentalStart || r.rentalEnd) && (
                      <span>
                        {fmtDate(r.rentalStart)} → {fmtDate(r.rentalEnd)}
                      </span>
                    )}
                    {r.usageZone && <span>· {r.usageZone}</span>}
                    {r.operatorNeeded && <span>· Operator</span>}
                    {r.nightShift && <Badge variant="warning">Gecə</Badge>}
                    <span>· {r.offerCount} təklif</span>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{fmtDate(r.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!showForm && (
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          + Sorğu əlavə et
        </Button>
      )}

      {showForm && (
        <form
          onSubmit={onAdd}
          className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3"
        >
          <FormField label="Texnika növü" htmlFor="req-type" required>
            <Input
              id="req-type"
              name="equipmentType"
              required
              placeholder="Məs.: Sizik lift 12m"
            />
          </FormField>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FormField label="İş hündürlüyü (m)" htmlFor="req-h">
              <Input id="req-h" name="workingHeightMeters" type="number" step="0.1" min="0" />
            </FormField>
            <FormField label="Başlama tarixi" htmlFor="req-from">
              <Input id="req-from" name="rentalStart" type="date" />
            </FormField>
            <FormField label="Bitmə tarixi" htmlFor="req-to">
              <Input id="req-to" name="rentalEnd" type="date" />
            </FormField>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FormField label="İstifadə ərazisi" htmlFor="req-zone" className="md:col-span-2">
              <Input id="req-zone" name="usageZone" placeholder="Məs.: Baku Tower" />
            </FormField>
            <FormField label="Daşıma məsuliyyəti" htmlFor="req-delivery">
              <Select
                id="req-delivery"
                name="deliveryResponsibility"
                defaultValue={DeliveryResponsibility.CUSTOMER}
              >
                {Object.values(DeliveryResponsibility).map((d) => (
                  <option key={d} value={d}>
                    {DELIVERY_RESPONSIBILITY_LABELS[d]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <Checkbox name="operatorNeeded" value="true" />
              Operator lazımdır
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <Checkbox name="nightShift" value="true" />
              Gecə növbəsi
            </label>
          </div>
          <FormField label="Qeydlər" htmlFor="req-notes">
            <Textarea id="req-notes" name="notes" rows={2} />
          </FormField>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
            >
              Ləğv et
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Əlavə olunur..." : "Əlavə et"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
