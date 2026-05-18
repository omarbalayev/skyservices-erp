"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/form-field";

type Initial = {
  name?: string;
  voen?: string | null;
  billingAddress?: string | null;
  numberingPrefix?: string | null;
  notes?: string | null;
};

export default function ClientForm({
  initial,
  action,
  submitLabel = "Yadda saxla",
}: {
  initial?: Initial;
  /** Server action — receives FormData; may return { ok:false, error } on validation failure. */
  action: (formData: FormData) => Promise<{ ok: false; error: string } | void>;
  submitLabel?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await action(fd);
    setSubmitting(false);
    if (result && result.ok === false) setError(result.error);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormField label="Müştəri adı (hüquqi şəxs)" htmlFor="name" required>
        <Input
          id="name"
          name="name"
          defaultValue={initial?.name ?? ""}
          placeholder='Məs.: "LIFT-REX GROUP" MMC'
          required
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="VÖEN" htmlFor="voen" hint="Vergi ödəyicisinin eyniləşdirmə nömrəsi">
          <Input id="voen" name="voen" defaultValue={initial?.voen ?? ""} />
        </FormField>
        <FormField
          label="Hesab-faktura prefiksi"
          htmlFor="numberingPrefix"
          hint='Məs.: "LR" → LR-001, LR-002'
        >
          <Input
            id="numberingPrefix"
            name="numberingPrefix"
            defaultValue={initial?.numberingPrefix ?? ""}
            maxLength={10}
          />
        </FormField>
      </div>

      <FormField label="Hesab-faktura ünvanı" htmlFor="billingAddress">
        <Textarea
          id="billingAddress"
          name="billingAddress"
          defaultValue={initial?.billingAddress ?? ""}
          rows={2}
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
