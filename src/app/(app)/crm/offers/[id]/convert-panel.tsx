"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/form-field";
import { createMsaAndAddendumFromOffer } from "@/modules/agreements/actions";

type Option = { id: string; label: string };

export default function ConvertPanel({
  offerId,
  clients,
  equipment,
  defaultClientId,
}: {
  offerId: string;
  clients: Option[];
  equipment: Option[];
  defaultClientId?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await createMsaAndAddendumFromOffer(offerId, new FormData(e.currentTarget));
    setSubmitting(false);
    if (result && result.ok === false) setError(result.error);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-sm text-slate-600">
        Bu təklifdən <strong>MSA + RENTAL_START Əlavə</strong> yaradır. MSA mövcud deyilsə avtomatik yaradılır;
        təklifin qiyməti texnika sətrinə kopyalanır.
      </p>

      <FormField label="Müştəri" htmlFor="clientId" required>
        <Select id="clientId" name="clientId" required defaultValue={defaultClientId ?? ""}>
          <option value="">— Seçin —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </Select>
      </FormField>

      <p className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs text-slate-500">
        Yeni MSA yaranırsa, müqavilə nömrəsi sistem tərəfindən avtomatik veriləcək.
      </p>

      <FormField label="Texnika" htmlFor="equipmentId" required>
        <Select id="equipmentId" name="equipmentId" required defaultValue="">
          <option value="">— Seçin —</option>
          {equipment.map((e) => (
            <option key={e.id} value={e.id}>
              {e.label}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="İcarə başlanğıcı" htmlFor="effectiveFrom" required>
          <Input id="effectiveFrom" name="effectiveFrom" type="date" required />
        </FormField>
        <FormField label="İcarə bitmə tarixi" htmlFor="effectiveTo">
          <Input id="effectiveTo" name="effectiveTo" type="date" />
        </FormField>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Yaradılır..." : "MSA + Əlavə yarat"}
        </Button>
      </div>
    </form>
  );
}
