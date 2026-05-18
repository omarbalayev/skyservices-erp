"use client";

import { useState, type FormEvent } from "react";
import type { EquipmentStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/form-field";

type Initial = {
  code?: string;
  name?: string;
  type?: string;
  manufacturer?: string | null;
  model?: string | null;
  year?: number | null;
  serial?: string | null;
  dqn?: string | null;
  status?: EquipmentStatus;
  currentLocation?: string | null;
  cmsProductUrl?: string | null;
  notes?: string | null;
};

export default function EquipmentForm({
  initial,
  action,
  submitLabel = "Yadda saxla",
}: {
  initial?: Initial;
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
      <FormField label="Kod" htmlFor="code" required hint="Məs.: FL-031">
        <Input id="code" name="code" defaultValue={initial?.code ?? ""} required />
      </FormField>

      {/* Status is auto-managed by contract/garage actions — see equipment detail page. */}
      <input type="hidden" name="status" value={initial?.status ?? "AVAILABLE"} />

      <FormField label="Ad" htmlFor="name" required>
        <Input id="name" name="name" defaultValue={initial?.name ?? ""} required />
      </FormField>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Növ" htmlFor="type" required hint="Məs.: Scissor Lift, Cherry Picker, Forklift">
          <Input id="type" name="type" defaultValue={initial?.type ?? ""} required />
        </FormField>
        <FormField label="İstehsal ili" htmlFor="year">
          <Input
            id="year"
            name="year"
            type="number"
            min={1900}
            max={2100}
            defaultValue={initial?.year ?? ""}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="İstehsalçı" htmlFor="manufacturer">
          <Input id="manufacturer" name="manufacturer" defaultValue={initial?.manufacturer ?? ""} />
        </FormField>
        <FormField label="Model" htmlFor="model">
          <Input id="model" name="model" defaultValue={initial?.model ?? ""} />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Seriya nömrəsi (S/N)" htmlFor="serial">
          <Input id="serial" name="serial" defaultValue={initial?.serial ?? ""} />
        </FormField>
        <FormField label="DQN" htmlFor="dqn" hint="Dövlət qeydiyyat nömrəsi">
          <Input id="dqn" name="dqn" defaultValue={initial?.dqn ?? ""} />
        </FormField>
      </div>

      <FormField label="Yerləşdiyi ərazi" htmlFor="currentLocation">
        <Input
          id="currentLocation"
          name="currentLocation"
          defaultValue={initial?.currentLocation ?? ""}
          placeholder="Məs.: Sitalçay, Baku Tower, Baza"
        />
      </FormField>

      <FormField
        label="skyservices.az məhsul səhifəsi"
        htmlFor="cmsProductUrl"
        hint="Texniki spesifikasiyalar üçün — texnika məlumat səhifəsindən link kopyalayın"
      >
        <Input
          id="cmsProductUrl"
          name="cmsProductUrl"
          type="url"
          defaultValue={initial?.cmsProductUrl ?? ""}
          placeholder="https://skyservices.az/az/products/..."
        />
      </FormField>

      <FormField label="Qeydlər" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} rows={3} />
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saxlanılır..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
