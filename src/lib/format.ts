/**
 * Formatting helpers — Azerbaijani locale by default.
 * Dates: dd.MM.yyyy. Currency: AZN with thousands grouping.
 */

import type { Decimal } from "@prisma/client/runtime/library";

const DATE_FMT = new Intl.DateTimeFormat("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });
const DATETIME_FMT = new Intl.DateTimeFormat("az-AZ", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const MONEY_FMT = new Intl.NumberFormat("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FMT.format(date);
}

export function fmtDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return DATETIME_FMT.format(date);
}

export function fmtAzn(value: Decimal | number | string | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const n = typeof value === "number" ? value : Number(value.toString());
  if (Number.isNaN(n)) return "—";
  return `${MONEY_FMT.format(n)} AZN`;
}

export function toDateInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
