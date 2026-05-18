import { z } from "zod";
import {
  BelowBaselineRule,
  OfferStatus,
  RentalPeriodType,
  TransportResponsibility,
  VatTreatment,
} from "@prisma/client";

const trimmedOrNull = z
  .string()
  .max(2000)
  .optional()
  .nullable()
  .transform((v) => (v && v.trim() ? v.trim() : null));

export const offerSchema = z.object({
  status: z.nativeEnum(OfferStatus).default(OfferStatus.DRAFT),

  rentalPeriodType: z.nativeEnum(RentalPeriodType).default(RentalPeriodType.MONTHLY),
  baseDaysPerMonth: z
    .union([z.coerce.number().int().refine((n) => n === 26 || n === 28, "26 və ya 28 olmalıdır"), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null || v === undefined ? null : (v as number))),
  baseHoursPerDay: z
    .union([z.coerce.number().int().refine((n) => n === 8 || n === 9 || n === 10, "8, 9 və ya 10 olmalıdır"), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null || v === undefined ? null : (v as number))),
  baseFee: z.coerce.number().positive("Tarif müsbət olmalıdır"),

  belowBaselineRule: z.nativeEnum(BelowBaselineRule).default(BelowBaselineRule.FLAT_MONTHLY),
  transportResponsibility: z.nativeEnum(TransportResponsibility).default(TransportResponsibility.CUSTOMER),
  operatorIncluded: z.coerce.boolean().optional().default(false),
  vatTreatment: z.nativeEnum(VatTreatment).default(VatTreatment.EXCLUSIVE),

  validUntil: z
    .union([z.coerce.date(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null || v === undefined ? null : (v as Date))),
  notes: trimmedOrNull,
});
export type OfferInput = z.infer<typeof offerSchema>;
