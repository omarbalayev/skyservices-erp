import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Ad boş ola bilməz").max(200),
  voen: z
    .string()
    .max(20)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  billingAddress: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  notes: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
});
export type ClientInput = z.infer<typeof clientSchema>;

export const contactSchema = z.object({
  name: z.string().min(1, "Ad boş ola bilməz").max(200),
  phone: z
    .string()
    .max(50)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  email: z
    .union([z.string().email("Email düzgün deyil"), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v && v !== "" ? v : null)),
  position: z
    .string()
    .max(200)
    .optional()
    .nullable()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  isPrimary: z.coerce.boolean().optional().default(false),
});
export type ContactInput = z.infer<typeof contactSchema>;
