import { z } from "zod";
import { LeadLostReason, LeadSource, LeadStatus, RequestStatus, DeliveryResponsibility } from "@prisma/client";

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

const optNum = (max: number) =>
  z
    .union([z.coerce.number().nonnegative().max(max), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null || v === undefined ? null : (v as number)));

/**
 * Combined Lead + first Request, used by the New Lead form.
 * Status is NOT captured here — new leads default to NEW server-side.
 */
export const newLeadWithRequestSchema = z.object({
  // Lead fields
  source: z.nativeEnum(LeadSource).default(LeadSource.PHONE),
  clientId: optStr(50),
  companyName: optStr(200),
  contactName: optStr(200),
  contactPhone: optStr(50),
  contactEmail: z
    .union([z.string().email("Email düzgün deyil"), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v && v !== "" ? v : null)),
  description: optStr(2000),
  ownerId: optStr(50),

  // Initial Request fields
  equipmentType: z.string().min(1, "Texnika növü tələb olunur").max(200),
  workingHeightMeters: optNum(100),
  rentalStart: optDate,
  rentalEnd: optDate,
  usageZone: optStr(200),
  deliveryResponsibility: z
    .nativeEnum(DeliveryResponsibility)
    .default(DeliveryResponsibility.CUSTOMER),
  operatorNeeded: z.coerce.boolean().optional().default(false),
  nightShift: z.coerce.boolean().optional().default(false),
  requestNotes: optStr(2000),
});
export type NewLeadWithRequestInput = z.infer<typeof newLeadWithRequestSchema>;

export const leadSchema = z.object({
  source: z.nativeEnum(LeadSource).default(LeadSource.PHONE),
  status: z.nativeEnum(LeadStatus).default(LeadStatus.NEW),
  lostReason: z
    .union([z.nativeEnum(LeadLostReason), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === null || v === undefined ? null : (v as LeadLostReason))),
  lostNote: optStr(500),

  clientId: optStr(50),
  companyName: optStr(200),
  contactName: optStr(200),
  contactPhone: optStr(50),
  contactEmail: z
    .union([z.string().email("Email düzgün deyil"), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v && v !== "" ? v : null)),

  description: optStr(2000),
  ownerId: optStr(50),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const requestSchema = z.object({
  status: z.nativeEnum(RequestStatus).default(RequestStatus.OPEN),
  equipmentType: z.string().min(1, "Texnika növü boş ola bilməz").max(200),
  workingHeightMeters: z
    .union([z.coerce.number().nonnegative().max(100), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null || v === undefined ? null : (v as number))),
  rentalStart: z
    .union([z.coerce.date(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null || v === undefined ? null : (v as Date))),
  rentalEnd: z
    .union([z.coerce.date(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null || v === undefined ? null : (v as Date))),
  usageZone: optStr(200),
  deliveryResponsibility: z.nativeEnum(DeliveryResponsibility).default(DeliveryResponsibility.CUSTOMER),
  operatorNeeded: z.coerce.boolean().optional().default(false),
  nightShift: z.coerce.boolean().optional().default(false),
  notes: optStr(2000),
});
export type RequestInput = z.infer<typeof requestSchema>;
