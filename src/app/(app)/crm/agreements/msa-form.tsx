"use client";

import { useState, type FormEvent } from "react";
import { MasterAgreementStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/form-field";
import { MSA_STATUS_LABELS } from "@/lib/enum-labels";
import { toDateInputValue } from "@/lib/format";

type Initial = {
  clientId?: string;
  agreementNumber?: string;
  status?: MasterAgreementStatus;
  signedAt?: Date | null;
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  autoRenew?: boolean;
  notes?: string | null;
};

export default function MsaForm({
  initial,
  clients,
  clientLocked,
  showAgreementNumber = true,
  action,
  submitLabel = "Yadda saxla",
}: {
  initial?: Initial;
  clients: { id: string; label: string }[];
  /** If true, the client select is rendered as a read-only hidden field (edit mode). */
  clientLocked?: boolean;
  /** When false (typical on create), the contract number is auto-generated server-side and the input is hidden. */
  showAgreementNumber?: boolean;
  action: (formData: FormData) => Promise<{ ok: false; error: string } | void>;
  submitLabel?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      {clientLocked ? (
        <input type="hidden" name="clientId" value={initial?.clientId ?? ""} />
      ) : (
        <FormField label="Müştəri" htmlFor="clientId" required>
          <Select id="clientId" name="clientId" required defaultValue={initial?.clientId ?? ""}>
            <option value="">— Seçin —</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      {showAgreementNumber ? (
        <FormField label="Müqavilə №" htmlFor="agreementNumber" hint="Məs.: SKY18042026">
          <Input
            id="agreementNumber"
            name="agreementNumber"
            defaultValue={initial?.agreementNumber ?? ""}
          />
        </FormField>
      ) : (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
          Müqavilə nömrəsi sistem tərəfindən avtomatik yaradılacaq (məs.{" "}
          <span className="font-mono">SKYDDMMYYYY</span>).
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={initial?.status ?? MasterAgreementStatus.DRAFT}>
            {Object.values(MasterAgreementStatus).map((s) => (
              <option key={s} value={s}>
                {MSA_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="İmzalanma tarixi" htmlFor="signedAt">
          <Input id="signedAt" name="signedAt" type="date" defaultValue={toDateInputValue(initial?.signedAt)} />
        </FormField>
        <FormField label="Avto. yenilənmə" htmlFor="autoRenew">
          <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
            <Checkbox name="autoRenew" value="true" defaultChecked={initial?.autoRenew ?? true} />
            İllik avtomatik
          </label>
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Etibarlı (başlama)" htmlFor="effectiveFrom">
          <Input
            id="effectiveFrom"
            name="effectiveFrom"
            type="date"
            defaultValue={toDateInputValue(initial?.effectiveFrom)}
          />
        </FormField>
        <FormField label="Etibarlı (bitmə)" htmlFor="effectiveTo">
          <Input
            id="effectiveTo"
            name="effectiveTo"
            type="date"
            defaultValue={toDateInputValue(initial?.effectiveTo)}
          />
        </FormField>
      </div>

      <FormField label="Qeydlər" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} defaultValue={initial?.notes ?? ""} />
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saxlanılır..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
