// Azerbaijani-friendly labels for our enums. UI uses these everywhere.
// Source of truth for backend values is prisma/schema.prisma.

import type {
  AddendumKind,
  AddendumStatus,
  BelowBaselineRule,
  DeliveryResponsibility,
  EquipmentStatus,
  LeadLostReason,
  LeadSource,
  LeadStatus,
  MasterAgreementStatus,
  OfferStatus,
  RentalPeriodType,
  RequestStatus,
  TransportResponsibility,
  UserRole,
  VatTreatment,
} from "@prisma/client";

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  OWNER: "Sahib",
  SALES: "Satış",
  GARAGE_MANAGER: "Qaraj meneceri",
  WAREHOUSE: "Anbar",
  ACCOUNTANT: "Mühasib",
  FLEET_OPS: "Texnika əməliyyatları",
  VIEWER: "Yalnız oxuma",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEB_FORM: "Veb forma",
  PHONE: "Telefon",
  EMAIL: "Email",
  WALK_IN: "Şəxsən gəliş",
  REFERRAL: "Tövsiyə",
  OTHER: "Digər",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: "Yeni",
  WORKING: "İşlənir",
  LOST: "İtirildi",
  CONVERTED: "Konvertasiya edildi",
};

export const LEAD_LOST_REASON_LABELS: Record<LeadLostReason, string> = {
  PRICE: "Qiymət",
  NO_FIT_EQUIPMENT: "Uyğun texnika yox",
  COMPETITOR: "Rəqib",
  TIMING: "Vaxt uyğunsuzluğu",
  NO_RESPONSE: "Cavab yox",
  OTHER: "Digər",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  OPEN: "Açıq",
  QUOTED: "Təklif verildi",
  REJECTED: "Rədd edildi",
  CONVERTED: "Konvertasiya edildi",
};

export const DELIVERY_RESPONSIBILITY_LABELS: Record<DeliveryResponsibility, string> = {
  PROVIDER: "İcraçı",
  CUSTOMER: "Sifarişçi",
};

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  DRAFT: "Qaralama",
  SENT: "Göndərildi",
  ACCEPTED: "Qəbul edildi",
  REJECTED: "Rədd edildi",
  EXPIRED: "Vaxtı keçdi",
  SUPERSEDED: "Əvəz edildi",
};

export const RENTAL_PERIOD_TYPE_LABELS: Record<RentalPeriodType, string> = {
  DAILY: "Günlük",
  WEEKLY: "Həftəlik",
  MONTHLY: "Aylıq",
};

export const BELOW_BASELINE_RULE_LABELS: Record<BelowBaselineRule, string> = {
  FLAT_MONTHLY: "Sabit aylıq (LR-004 tipli)",
  PRORATE_BY_HOURS: "Saat üzrə (Zetaş tipli)",
};

export const TRANSPORT_RESPONSIBILITY_LABELS: Record<TransportResponsibility, string> = {
  PROVIDER: "İcraçı",
  CUSTOMER: "Sifarişçi",
  BILLABLE_TO_CUSTOMER: "Sifarişçi (hesab-fakturada)",
};

export const VAT_TREATMENT_LABELS: Record<VatTreatment, string> = {
  EXCLUSIVE: "ƏDV daxil deyil",
  INCLUSIVE: "ƏDV daxildir",
  EXEMPT: "ƏDV-dən azad",
};

export const MSA_STATUS_LABELS: Record<MasterAgreementStatus, string> = {
  DRAFT: "Qaralama",
  SIGNED: "İmzalandı",
  ACTIVE: "Aktiv",
  EXPIRED: "Müddəti bitdi",
  TERMINATED: "Ləğv edildi",
};

export const ADDENDUM_KIND_LABELS: Record<AddendumKind, string> = {
  RENTAL_START: "İcarənin başlanğıcı",
  EQUIPMENT_CHANGE: "Texnika dəyişikliyi",
  PRICE_CHANGE: "Qiymət dəyişikliyi",
  PERIOD_EXTENSION: "Müddətin uzadılması",
  TERMINATION: "Xitam",
  OTHER: "Digər",
};

export const ADDENDUM_STATUS_LABELS: Record<AddendumStatus, string> = {
  DRAFT: "Qaralama",
  SIGNED: "İmzalandı",
  ACTIVE: "Aktiv",
  SUPERSEDED: "Əvəz edildi",
};

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  AVAILABLE: "Boşda",
  RESERVED: "Rezerv",
  ON_RENT: "İcarədə",
  IN_TRANSIT: "Daşınmada",
  IN_REPAIR: "Təmirdə",
  OUT_OF_SERVICE: "Xidmət xaricində",
};
