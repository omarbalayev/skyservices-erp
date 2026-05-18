"use client";

import { useState, type FormEvent } from "react";
import { LeadLostReason, LeadSource, LeadStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/form-field";
import {
  LEAD_LOST_REASON_LABELS,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
} from "@/lib/enum-labels";

type Initial = {
  source?: LeadSource;
  status?: LeadStatus;
  lostReason?: LeadLostReason | null;
  lostNote?: string | null;
  clientId?: string | null;
  companyName?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  description?: string | null;
  ownerId?: string | null;
};

type Option = { id: string; label: string };

export default function LeadForm({
  initial,
  clients,
  owners,
  action,
  submitLabel = "Yadda saxla",
}: {
  initial?: Initial;
  clients: Option[];
  owners: Option[];
  action: (formData: FormData) => Promise<{ ok: false; error: string } | void>;
  submitLabel?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<LeadStatus>(initial?.status ?? LeadStatus.NEW);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await action(new FormData(e.currentTarget));
    setSubmitting(false);
    if (result && result.ok === false) setError(result.error);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField label="Mənbə" htmlFor="source">
          <Select id="source" name="source" defaultValue={initial?.source ?? LeadSource.PHONE}>
            {Object.values(LeadSource).map((s) => (
              <option key={s} value={s}>
                {LEAD_SOURCE_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Status" htmlFor="status">
          <Select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as LeadStatus)}
          >
            {Object.values(LeadStatus).map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Məsul satış" htmlFor="ownerId">
          <Select id="ownerId" name="ownerId" defaultValue={initial?.ownerId ?? ""}>
            <option value="">— Seçin —</option>
            {owners.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField
        label="Mövcud müştəri (varsa)"
        htmlFor="clientId"
        hint="Müştəri əvvəldən sistemdə varsa seçin. Əks halda aşağıdakı sahələri doldurun."
      >
        <Select id="clientId" name="clientId" defaultValue={initial?.clientId ?? ""}>
          <option value="">— Seçilməyib —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Şirkət adı (yeni müştəri üçün)" htmlFor="companyName">
          <Input id="companyName" name="companyName" defaultValue={initial?.companyName ?? ""} />
        </FormField>
        <FormField label="Əlaqədar şəxs" htmlFor="contactName">
          <Input id="contactName" name="contactName" defaultValue={initial?.contactName ?? ""} />
        </FormField>
        <FormField label="Telefon" htmlFor="contactPhone">
          <Input id="contactPhone" name="contactPhone" defaultValue={initial?.contactPhone ?? ""} />
        </FormField>
        <FormField label="Email" htmlFor="contactEmail">
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={initial?.contactEmail ?? ""}
          />
        </FormField>
      </div>

      <FormField label="Müraciətin təfərrüatı" htmlFor="description">
        <Textarea id="description" name="description" defaultValue={initial?.description ?? ""} rows={3} />
      </FormField>

      {status === LeadStatus.LOST && (
        <div className="rounded-md border border-red-100 bg-red-50 p-3">
          <div className="mb-2 text-sm font-medium text-red-700">İtirilmə səbəbi</div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FormField label="Səbəb" htmlFor="lostReason">
              <Select id="lostReason" name="lostReason" defaultValue={initial?.lostReason ?? ""}>
                <option value="">— Seçin —</option>
                {Object.values(LeadLostReason).map((r) => (
                  <option key={r} value={r}>
                    {LEAD_LOST_REASON_LABELS[r]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Qeyd" htmlFor="lostNote" className="md:col-span-2">
              <Input id="lostNote" name="lostNote" defaultValue={initial?.lostNote ?? ""} />
            </FormField>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saxlanılır..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
