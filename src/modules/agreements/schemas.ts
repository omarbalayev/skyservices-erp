import { z } from "zod";
import {
  AddendumKind,
  AddendumStatus,
  BelowBaselineRule,
  MasterAgreementStatus,
  RentalPeriodType,
  TransportResponsibility,
  VatTreatment,
} from "@prisma/client";

const optStr = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null));

const optDate = z
  .union([z.coerce.date(), z.literal("")])
  .optional()
  .nullable()
  .transform((v) => (v === "" || v === null || v === undefined ? null : (v as Date)));

export const masterAgreementSchema = z.object({
  clientId: z.string().min(1, "Müştəri tələb olunur"),
  agreementNumber: z
    .string()
    .min(1, "Müqavilə nömrəsi tələb olunur")
    .max(50)
    .transform((v) => v.trim().toUpperCase()),
  status: z.nativeEnum(MasterAgreementStatus).default(MasterAgreementStatus.DRAFT),
  signedAt: optDate,
  effectiveFrom: optDate,
  effectiveTo: optDate,
  autoRenew: z.coerce.boolean().optional().default(true),
  notes: optStr(2000),
});
export type MasterAgreementInput = z.infer<typeof masterAgreementSchema>;

export const addendumSchema = z.object({
  kind: z.nativeEnum(AddendumKind).default(AddendumKind.RENTAL_START),
  status: z.nativeEnum(AddendumStatus).default(AddendumStatus.DRAFT),
  offerId: optStr(50),
  effectiveFrom: optDate,
  effectiveTo: optDate,
  notes: optStr(2000),
});
export type AddendumInput = z.infer<typeof addendumSchema>;

export const addendumEquipmentSchema = z.object({
  equipmentId: z.string().min(1, "Texnika tələb olunur"),
  rentalPeriodType: z.nativeEnum(RentalPeriodType).default(RentalPeriodType.MONTHLY),
  baseDaysPerMonth: z
    .union([z.coerce.number().int().refine((n) => n === 26 || n === 28, "26 və ya 28"), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null || v === undefined ? null : (v as number))),
  baseHoursPerDay: z
    .union([z.coerce.number().int().refine((n) => n === 8 || n === 9 || n === 10, "8/9/10"), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null || v === undefined ? null : (v as number))),
  baseFee: z.coerce.number().positive("Tarif müsbət olmalıdır"),
  belowBaselineRule: z.nativeEnum(BelowBaselineRule).default(BelowBaselineRule.FLAT_MONTHLY),
  operatorIncluded: z.coerce.boolean().optional().default(false),
  transportResponsibility: z.nativeEnum(TransportResponsibility).default(TransportResponsibility.CUSTOMER),
  vatTreatment: z.nativeEnum(VatTreatment).default(VatTreatment.EXCLUSIVE),
  startedAt: optDate,
  endedAt: optDate,
  notes: optStr(2000),
});
export type AddendumEquipmentInput = z.infer<typeof addendumEquipmentSchema>;
