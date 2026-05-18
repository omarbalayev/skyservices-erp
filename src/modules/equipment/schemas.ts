import { z } from "zod";
import { EquipmentStatus } from "@prisma/client";

const trimmedOrNull = z
  .string()
  .max(200)
  .optional()
  .nullable()
  .transform((v) => (v && v.trim() ? v.trim() : null));

export const equipmentSchema = z.object({
  code: z.string().min(1, "Kod boş ola bilməz").max(50).transform((v) => v.trim().toUpperCase()),
  name: z.string().min(1, "Ad boş ola bilməz").max(200),
  type: z.string().min(1, "Növ boş ola bilməz").max(100),
  manufacturer: trimmedOrNull,
  model: trimmedOrNull,
  year: z
    .union([z.coerce.number().int().min(1900).max(2100), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" || v === null || v === undefined ? null : (v as number))),
  serial: trimmedOrNull,
  dqn: trimmedOrNull,
  status: z.nativeEnum(EquipmentStatus).default(EquipmentStatus.AVAILABLE),
  currentLocation: trimmedOrNull,
  cmsProductUrl: z
    .union([z.string().url("URL düzgün deyil"), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v && v !== "" ? v : null)),
  notes: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
});
export type EquipmentInput = z.infer<typeof equipmentSchema>;
