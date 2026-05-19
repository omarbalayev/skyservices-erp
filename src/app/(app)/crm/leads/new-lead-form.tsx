"use client";

import { useState, type FormEvent } from "react";
import { DeliveryResponsibility, LeadSource } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/form-field";
import { DELIVERY_RESPONSIBILITY_LABELS, LEAD_SOURCE_LABELS } from "@/lib/enum-labels";

// Combined create form — captures Lead + first Request in a single submit.
// No status field (defaults to NEW server-side).

type Option = { id: string; label: string };

export default function NewLeadForm({
  clients,
  owners,
  defaultOwnerId,
  action,
}: {
  clients: Option[];
  owners: Option[];
  defaultOwnerId?: string;
  action: (formData: FormData) => Promise<{ ok: false; error: string } | void>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clientId, setClientId] = useState<string>("");

  const hasClient = clientId !== "";
  const selectedClientLabel = clients.find((c) => c.id === clientId)?.label ?? "";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await action(new FormData(e.currentTarget));
    setSubmitting(false);
    if (result && result.ok === false) setError(result.error);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* ---------------- Customer section ---------------- */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Müştəri</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Mənbə" htmlFor="source">
            <Select id="source" name="source" defaultValue={LeadSource.PHONE}>
              {Object.values(LeadSource).map((s) => (
                <option key={s} value={s}>
                  {LEAD_SOURCE_LABELS[s]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Məsul satış" htmlFor="ownerId">
            <Select id="ownerId" name="ownerId" defaultValue={defaultOwnerId ?? ""}>
              <option value="">— Seçin —</option>
              {owners.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Mövcud müştəri" htmlFor="clientId">
            <Select
              id="clientId"
              name="clientId"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">— Yeni müştəri —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {hasClient ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
            <span className="text-slate-500">Seçilmiş müştəri: </span>
            <span className="font-medium text-slate-900">{selectedClientLabel}</span>
            <p className="mt-1 text-xs text-slate-500">
              Şirkət məlumatları müştəri kartından götürüləcək. Aşağıda yalnız bu konkret müraciət üçün
              əlaqədar şəxsi qeyd edə bilərsiniz (istəyə bağlı).
            </p>
          </div>
        ) : (
          <FormField label="Şirkət adı (yeni müştəri)" htmlFor="companyName" required={!hasClient}>
            <Input id="companyName" name="companyName" required={!hasClient} />
          </FormField>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="Əlaqədar şəxs" htmlFor="contactName">
            <Input id="contactName" name="contactName" />
          </FormField>
          <FormField label="Telefon" htmlFor="contactPhone">
            <Input id="contactPhone" name="contactPhone" />
          </FormField>
          <FormField label="Email" htmlFor="contactEmail">
            <Input id="contactEmail" name="contactEmail" type="email" />
          </FormField>
        </div>

        <FormField label="Müraciətin təfərrüatı" htmlFor="description">
          <Textarea id="description" name="description" rows={2} />
        </FormField>
      </section>

      {/* ---------------- Request section ---------------- */}
      <section className="space-y-4 rounded-md border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Sorğu (texnika)</h2>

        <FormField label="Texnika növü" htmlFor="equipmentType" required hint="Məs.: Scissor lift 12m">
          <Input id="equipmentType" name="equipmentType" required />
        </FormField>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="İş hündürlüyü (m)" htmlFor="workingHeightMeters">
            <Input id="workingHeightMeters" name="workingHeightMeters" type="number" step="0.1" min="0" />
          </FormField>
          <FormField label="Başlama tarixi" htmlFor="rentalStart">
            <Input id="rentalStart" name="rentalStart" type="date" />
          </FormField>
          <FormField label="Bitmə tarixi" htmlFor="rentalEnd">
            <Input id="rentalEnd" name="rentalEnd" type="date" />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField label="İstifadə ərazisi" htmlFor="usageZone" className="md:col-span-2">
            <Input id="usageZone" name="usageZone" placeholder="Məs.: Baku Tower" />
          </FormField>
          <FormField label="Daşıma məsuliyyəti" htmlFor="deliveryResponsibility">
            <Select
              id="deliveryResponsibility"
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
          <label className="inline-flex items-center gap-2 text-sm text-amber-800">
            <Checkbox name="nightShift" value="true" />
            Gecə növbəsi
          </label>
        </div>

        <FormField label="Sorğu qeydləri" htmlFor="requestNotes">
          <Textarea id="requestNotes" name="requestNotes" rows={2} />
        </FormField>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Yaradılır..." : "Müraciəti yarat"}
        </Button>
      </div>
    </form>
  );
}
