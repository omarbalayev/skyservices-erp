-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEB_FORM', 'PHONE', 'EMAIL', 'WALK_IN', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'WORKING', 'LOST', 'CONVERTED');

-- CreateEnum
CREATE TYPE "LeadLostReason" AS ENUM ('PRICE', 'NO_FIT_EQUIPMENT', 'COMPETITOR', 'TIMING', 'NO_RESPONSE', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'QUOTED', 'REJECTED', 'CONVERTED');

-- CreateEnum
CREATE TYPE "DeliveryResponsibility" AS ENUM ('PROVIDER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "RentalPeriodType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "BelowBaselineRule" AS ENUM ('FLAT_MONTHLY', 'PRORATE_BY_HOURS');

-- CreateEnum
CREATE TYPE "TransportResponsibility" AS ENUM ('PROVIDER', 'CUSTOMER', 'BILLABLE_TO_CUSTOMER');

-- CreateEnum
CREATE TYPE "VatTreatment" AS ENUM ('EXCLUSIVE', 'INCLUSIVE', 'EXEMPT');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "MasterAgreementStatus" AS ENUM ('DRAFT', 'SIGNED', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "AddendumKind" AS ENUM ('RENTAL_START', 'EQUIPMENT_CHANGE', 'PRICE_CHANGE', 'PERIOD_EXTENSION', 'TERMINATION', 'OTHER');

-- CreateEnum
CREATE TYPE "AddendumStatus" AS ENUM ('DRAFT', 'SIGNED', 'ACTIVE', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'ON_RENT', 'IN_TRANSIT', 'IN_REPAIR', 'OUT_OF_SERVICE');

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "voen" TEXT,
    "billingAddress" TEXT,
    "notes" TEXT,
    "numberingPrefix" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "position" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "source" "LeadSource" NOT NULL DEFAULT 'PHONE',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "lostReason" "LeadLostReason",
    "lostNote" TEXT,
    "clientId" TEXT,
    "companyName" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "description" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "equipmentType" TEXT NOT NULL,
    "workingHeightMeters" DECIMAL(6,2),
    "rentalStart" TIMESTAMP(3),
    "rentalEnd" TIMESTAMP(3),
    "usageZone" TEXT,
    "deliveryResponsibility" "DeliveryResponsibility" NOT NULL DEFAULT 'CUSTOMER',
    "operatorNeeded" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "rentalPeriodType" "RentalPeriodType" NOT NULL DEFAULT 'MONTHLY',
    "baseDaysPerMonth" INTEGER,
    "baseHoursPerDay" INTEGER,
    "baseFee" DECIMAL(12,2) NOT NULL,
    "belowBaselineRule" "BelowBaselineRule" NOT NULL DEFAULT 'FLAT_MONTHLY',
    "transportResponsibility" "TransportResponsibility" NOT NULL DEFAULT 'CUSTOMER',
    "operatorIncluded" BOOLEAN NOT NULL DEFAULT false,
    "vatTreatment" "VatTreatment" NOT NULL DEFAULT 'EXCLUSIVE',
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterAgreement" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agreementNumber" TEXT NOT NULL,
    "status" "MasterAgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "pdfPath" TEXT,
    "signedCopyPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MasterAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addendum" (
    "id" TEXT NOT NULL,
    "masterAgreementId" TEXT NOT NULL,
    "addendumNumber" INTEGER NOT NULL,
    "kind" "AddendumKind" NOT NULL,
    "status" "AddendumStatus" NOT NULL DEFAULT 'DRAFT',
    "offerId" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "notes" TEXT,
    "supersededByAddendumId" TEXT,
    "pdfPath" TEXT,
    "signedCopyPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Addendum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddendumEquipment" (
    "id" TEXT NOT NULL,
    "addendumId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "rentalPeriodType" "RentalPeriodType" NOT NULL DEFAULT 'MONTHLY',
    "baseDaysPerMonth" INTEGER,
    "baseHoursPerDay" INTEGER,
    "baseFee" DECIMAL(12,2) NOT NULL,
    "belowBaselineRule" "BelowBaselineRule" NOT NULL DEFAULT 'FLAT_MONTHLY',
    "operatorIncluded" BOOLEAN NOT NULL DEFAULT false,
    "transportResponsibility" "TransportResponsibility" NOT NULL DEFAULT 'CUSTOMER',
    "vatTreatment" "VatTreatment" NOT NULL DEFAULT 'EXCLUSIVE',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AddendumEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "serial" TEXT,
    "dqn" TEXT,
    "status" "EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentLocation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_voen_key" ON "Client"("voen");

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "Client"("name");

-- CreateIndex
CREATE INDEX "Contact_clientId_idx" ON "Contact"("clientId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_ownerId_idx" ON "Lead"("ownerId");

-- CreateIndex
CREATE INDEX "Lead_clientId_idx" ON "Lead"("clientId");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "Request_leadId_idx" ON "Request"("leadId");

-- CreateIndex
CREATE INDEX "Offer_requestId_idx" ON "Offer"("requestId");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MasterAgreement_clientId_key" ON "MasterAgreement"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "MasterAgreement_agreementNumber_key" ON "MasterAgreement"("agreementNumber");

-- CreateIndex
CREATE INDEX "MasterAgreement_status_idx" ON "MasterAgreement"("status");

-- CreateIndex
CREATE INDEX "MasterAgreement_effectiveTo_idx" ON "MasterAgreement"("effectiveTo");

-- CreateIndex
CREATE INDEX "Addendum_masterAgreementId_idx" ON "Addendum"("masterAgreementId");

-- CreateIndex
CREATE INDEX "Addendum_status_idx" ON "Addendum"("status");

-- CreateIndex
CREATE INDEX "Addendum_effectiveTo_idx" ON "Addendum"("effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "Addendum_masterAgreementId_addendumNumber_key" ON "Addendum"("masterAgreementId", "addendumNumber");

-- CreateIndex
CREATE INDEX "AddendumEquipment_addendumId_idx" ON "AddendumEquipment"("addendumId");

-- CreateIndex
CREATE INDEX "AddendumEquipment_equipmentId_idx" ON "AddendumEquipment"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_code_key" ON "Equipment"("code");

-- CreateIndex
CREATE INDEX "Equipment_code_idx" ON "Equipment"("code");

-- CreateIndex
CREATE INDEX "Equipment_status_idx" ON "Equipment"("status");

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterAgreement" ADD CONSTRAINT "MasterAgreement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addendum" ADD CONSTRAINT "Addendum_masterAgreementId_fkey" FOREIGN KEY ("masterAgreementId") REFERENCES "MasterAgreement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addendum" ADD CONSTRAINT "Addendum_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addendum" ADD CONSTRAINT "Addendum_supersededByAddendumId_fkey" FOREIGN KEY ("supersededByAddendumId") REFERENCES "Addendum"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddendumEquipment" ADD CONSTRAINT "AddendumEquipment_addendumId_fkey" FOREIGN KEY ("addendumId") REFERENCES "Addendum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddendumEquipment" ADD CONSTRAINT "AddendumEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
