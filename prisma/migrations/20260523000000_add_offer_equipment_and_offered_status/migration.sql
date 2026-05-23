-- AlterEnum: add OFFERED before ON_RENT so the catalog order reads naturally
-- (AVAILABLE → RESERVED → OFFERED → ON_RENT → IN_TRANSIT → IN_REPAIR → OUT_OF_SERVICE).
ALTER TYPE "EquipmentStatus" ADD VALUE 'OFFERED' BEFORE 'ON_RENT';

-- CreateTable
CREATE TABLE "OfferEquipment" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "rentalPeriodType" "RentalPeriodType" NOT NULL DEFAULT 'MONTHLY',
    "baseDaysPerMonth" INTEGER,
    "baseHoursPerDay" INTEGER,
    "baseFee" DECIMAL(12,2) NOT NULL,
    "belowBaselineRule" "BelowBaselineRule" NOT NULL DEFAULT 'FLAT_MONTHLY',
    "operatorIncluded" BOOLEAN NOT NULL DEFAULT false,
    "nightShift" BOOLEAN NOT NULL DEFAULT false,
    "transportResponsibility" "TransportResponsibility" NOT NULL DEFAULT 'CUSTOMER',
    "vatTreatment" "VatTreatment" NOT NULL DEFAULT 'EXCLUSIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferEquipment_offerId_idx" ON "OfferEquipment"("offerId");

-- CreateIndex
CREATE INDEX "OfferEquipment_equipmentId_idx" ON "OfferEquipment"("equipmentId");

-- AddForeignKey
ALTER TABLE "OfferEquipment" ADD CONSTRAINT "OfferEquipment_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferEquipment" ADD CONSTRAINT "OfferEquipment_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
