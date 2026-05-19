"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { FormField } from "@/components/form-field";
import {
  RENTAL_PERIOD_TYPE_LABELS,
  TRANSPORT_RESPONSIBILITY_LABELS,
  VAT_TREATMENT_LABELS,
} from "@/lib/enum-labels";
import { fmtAzn, fmtDate } from "@/lib/format";
import { addAddendumEquipment, removeAddendumEquipment } from "@/modules/agreements/actions";

type Line = {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  rentalPeriodType: RentalPeriodType;
  baseDaysPerMonth: number | null;
  baseHoursPerDay: number | null;
  baseFee: string;
  belowBaselineRule: BelowBaselineRule;
  operatorIncluded: boolean;
  nightShift: boolean;
  transportResponsibility: TransportResponsibility;
  vatTreatment: VatTreatment;
  startedAt: Date | null;
  endedAt: Date | null;
};

type Option = { id: string; label: string };

export default function EquipmentLinesPanel({
  addendumId,
  lines,
  availableEquipment,
  editable,
}: {
  addendumId: string;
  lines: Line[];
  availableEquipment: Option[];
  editable: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [periodType, setPeriodType] = useState<RentalPeriodType>(RentalPeriodType.MONTHLY);

  async function onAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget; // capture before await
    setSubmitting(true);
    setError(null);
    const result = await addAddendumEquipment(addendumId, new FormData(formEl));
    setSubmitting(false);
    if (result?.ok === false) {
      setError(result.error);
    } else {
      formEl.reset();
      setShowForm(false);
      setPeriodType(RentalPeriodType.MONTHLY);
    }
  }

  async function onRemove(id: string) {
    if (!confirm("Bu sətri silmək istədiyinizə əminsinizmi?")) return;
    await removeAddendumEquipment(id);
  }

  const isMonthly = periodType === RentalPeriodType.MONTHLY;

  return (
    <div className="space-y-3">
      {lines.length === 0 ? (
        <p className="text-sm text-slate-500">Bu əlavədə texnika sətri yoxdur.</p>
      ) : (
        <div className="space-y-2">
          {lines.map((l) => (
            <div key={l.id} className="rounded-md border border-slate-200 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-900">
                    <span className="font-mono text-slate-500">{l.equipmentCode}</span> — {l.equipmentName}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                    <Badge variant="outline">{RENTAL_PERIOD_TYPE_LABELS[l.rentalPeriodType]}</Badge>
                    <span className="font-medium">{fmtAzn(l.baseFee)}</span>
                    {l.rentalPeriodType === "MONTHLY" && l.baseDaysPerMonth && l.baseHoursPerDay && (
                      <span>
                        · {l.baseDaysPerMonth}g × {l.baseHoursPerDay}saat
                      </span>
                    )}
                    <span>· {TRANSPORT_RESPONSIBILITY_LABELS[l.transportResponsibility]}</span>
                    <span>· {VAT_TREATMENT_LABELS[l.vatTreatment]}</span>
                    {l.operatorIncluded && <span>· Operator daxil</span>}
                    {l.nightShift && <Badge variant="warning">Gecə</Badge>}
                    {(l.startedAt || l.endedAt) && (
                      <span>
                        · {fmtDate(l.startedAt)} → {fmtDate(l.endedAt)}
                      </span>
                    )}
                  </div>
                </div>
                {editable && (
                  <button
                    type="button"
                    onClick={() => onRemove(l.id)}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editable && !showForm && (
        <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(true)}>
          + Texnika sətri əlavə et
        </Button>
      )}

      {editable && showForm && (
        <form
          onSubmit={onAdd}
          className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3"
        >
          <FormField label="Texnika" htmlFor="equipmentId" required>
            <Select id="equipmentId" name="equipmentId" required defaultValue="">
              <option value="">— Seçin —</option>
              {availableEquipment.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
            <FormField label="Tarif (AZN)" htmlFor="baseFee" required>
              <Input id="baseFee" name="baseFee" type="number" step="0.01" min="0" required />
            </FormField>
            <FormField label="ƏDV" htmlFor="vatTreatment">
              <Select id="vatTreatment" name="vatTreatment" defaultValue={VatTreatment.EXCLUSIVE}>
                {Object.values(VatTreatment).map((v) => (
                  <option key={v} value={v}>
                    {VAT_TREATMENT_LABELS[v]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          {isMonthly && (
            <div className="grid grid-cols-1 gap-3 rounded-md bg-white p-2 md:grid-cols-3">
              <FormField label="Ayda gün" htmlFor="baseDaysPerMonth">
                <Select id="baseDaysPerMonth" name="baseDaysPerMonth">
                  <option value="">— Seçin —</option>
                  <option value="26">26</option>
                  <option value="28">28</option>
                </Select>
              </FormField>
              <FormField label="Gündə saat" htmlFor="baseHoursPerDay">
                <Select id="baseHoursPerDay" name="baseHoursPerDay">
                  <option value="">— Seçin —</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                </Select>
              </FormField>
              {/* belowBaselineRule intentionally hidden — defaults to FLAT_MONTHLY. */}
              <input type="hidden" name="belowBaselineRule" value={BelowBaselineRule.FLAT_MONTHLY} />
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <FormField label="Daşıma" htmlFor="transportResponsibility">
              <Select
                id="transportResponsibility"
                name="transportResponsibility"
                defaultValue={TransportResponsibility.CUSTOMER}
              >
                {Object.values(TransportResponsibility).map((t) => (
                  <option key={t} value={t}>
                    {TRANSPORT_RESPONSIBILITY_LABELS[t]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Başladı" htmlFor="startedAt">
              <Input id="startedAt" name="startedAt" type="date" />
            </FormField>
            <FormField label="Bitdi" htmlFor="endedAt">
              <Input id="endedAt" name="endedAt" type="date" />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <Checkbox name="operatorIncluded" value="true" />
              Operator daxildir
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-amber-800">
              <Checkbox name="nightShift" value="true" />
              Gecə növbəsi
            </label>
          </div>
          <FormField label="Qeydlər" htmlFor="notes">
            <Textarea id="notes" name="notes" rows={2} />
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
