"use client";

import { useState, type FormEvent } from "react";
import {
  BelowBaselineRule,
  RentalPeriodType,
  TransportResponsibility,
  VatTreatment,
} from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/form-field";
import {
  RENTAL_PERIOD_TYPE_LABELS,
  TRANSPORT_RESPONSIBILITY_LABELS,
  VAT_TREATMENT_LABELS,
} from "@/lib/enum-labels";

type Initial = {
  rentalPeriodType?: RentalPeriodType;
  baseDaysPerMonth?: number | null;
  baseHoursPerDay?: number | null;
  baseFee?: number | string;
  belowBaselineRule?: BelowBaselineRule;
  transportResponsibility?: TransportResponsibility;
  operatorIncluded?: boolean;
  nightShift?: boolean;
  vatTreatment?: VatTreatment;
  validUntil?: Date | null;
  notes?: string | null;
};

export default function OfferForm({
  initial,
  action,
  submitLabel = "Yadda saxla",
  onSuccess,
}: {
  initial?: Initial;
  action: (formData: FormData) => Promise<{ ok: true; data: unknown } | { ok: false; error: string } | void>;
  submitLabel?: string;
  onSuccess?: () => void;
}) {
  const [periodType, setPeriodType] = useState<RentalPeriodType>(
    initial?.rentalPeriodType ?? RentalPeriodType.MONTHLY,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await action(new FormData(e.currentTarget));
    setSubmitting(false);
    if (result && "ok" in result && result.ok === false) {
      setError(result.error);
      return;
    }
    onSuccess?.();
  }

  const isMonthly = periodType === RentalPeriodType.MONTHLY;
  const validUntilDate = initial?.validUntil
    ? initial.validUntil.toISOString().slice(0, 10)
    : "";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField label="İcarə dövrü" htmlFor="rentalPeriodType">
          <Select
            id="rentalPeriodType"
            name="rentalPeriodType"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as RentalPeriodType)}
          >
            {Object.values(RentalPeriodType).map((p) => (
              <option key={p} value={p}>
                {RENTAL_PERIOD_TYPE_LABELS[p]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          label={isMonthly ? "Aylıq tarif (AZN)" : periodType === "WEEKLY" ? "Həftəlik tarif (AZN)" : "Günlük tarif (AZN)"}
          htmlFor="baseFee"
          required
        >
          <Input
            id="baseFee"
            name="baseFee"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initial?.baseFee ?? ""}
            required
          />
        </FormField>
        <FormField label="Etibarlılıq tarixi" htmlFor="validUntil" hint="Boş = müddətsiz">
          <Input id="validUntil" name="validUntil" type="date" defaultValue={validUntilDate} />
        </FormField>
      </div>

      {isMonthly && (
        <div className="grid grid-cols-1 gap-4 rounded-md bg-slate-50 p-3 md:grid-cols-3">
          <FormField label="Ayda iş günü" htmlFor="baseDaysPerMonth" hint="26 və ya 28">
            <Select
              id="baseDaysPerMonth"
              name="baseDaysPerMonth"
              defaultValue={initial?.baseDaysPerMonth ?? ""}
            >
              <option value="">— Seçin —</option>
              <option value="26">26 gün</option>
              <option value="28">28 gün</option>
            </Select>
          </FormField>
          <FormField label="Gündə iş saatı" htmlFor="baseHoursPerDay" hint="8, 9 və ya 10">
            <Select
              id="baseHoursPerDay"
              name="baseHoursPerDay"
              defaultValue={initial?.baseHoursPerDay ?? ""}
            >
              <option value="">— Seçin —</option>
              <option value="8">8 saat</option>
              <option value="9">9 saat</option>
              <option value="10">10 saat</option>
            </Select>
          </FormField>
          {/* Pricing rule (razılaşma qaydası) is intentionally hidden — default is always
              FLAT_MONTHLY: customer pays the full agreed monthly fee regardless of actual
              hours used. Exceptional hourly-prorate arrangements will be handled separately. */}
          <input
            type="hidden"
            name="belowBaselineRule"
            value={initial?.belowBaselineRule ?? BelowBaselineRule.FLAT_MONTHLY}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FormField label="Daşıma məsuliyyəti" htmlFor="transportResponsibility">
          <Select
            id="transportResponsibility"
            name="transportResponsibility"
            defaultValue={initial?.transportResponsibility ?? TransportResponsibility.CUSTOMER}
          >
            {Object.values(TransportResponsibility).map((t) => (
              <option key={t} value={t}>
                {TRANSPORT_RESPONSIBILITY_LABELS[t]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="ƏDV" htmlFor="vatTreatment">
          <Select
            id="vatTreatment"
            name="vatTreatment"
            defaultValue={initial?.vatTreatment ?? VatTreatment.EXCLUSIVE}
          >
            {Object.values(VatTreatment).map((v) => (
              <option key={v} value={v}>
                {VAT_TREATMENT_LABELS[v]}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Operator daxildir" htmlFor="operatorIncluded">
          <label className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
            <Checkbox
              id="operatorIncluded"
              name="operatorIncluded"
              value="true"
              defaultChecked={!!initial?.operatorIncluded}
            />
            Bəli
          </label>
        </FormField>
      </div>

      <div className="rounded-md bg-amber-50 p-3">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-amber-800">
          <Checkbox
            id="nightShift"
            name="nightShift"
            value="true"
            defaultChecked={!!initial?.nightShift}
          />
          Gecə növbəsi istifadəsi
        </label>
        <p className="mt-1 text-xs text-amber-700">
          Müştəri texnikadan gecə vaxtı istifadə edəcəksə bunu erkən mərhələdə qeyd edin — Sorğu, Təklif, Əlavə,
          Hesab-faktura və bütün əlaqəli sənədlərdə göstəriləcək.
        </p>
      </div>

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
