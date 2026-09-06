-- CreateEnum
CREATE TYPE "TypeEvenementCalendrier" AS ENUM ('FERIE', 'VACANCES', 'EXAMEN', 'AUTRE');

-- AlterEnum
ALTER TYPE "TypeNotification" ADD VALUE 'CAPACITE';

-- AlterTable
ALTER TABLE "eleves" ADD COLUMN     "parentUserId" TEXT;

-- CreateTable
CREATE TABLE "evenements_calendrier" (
    "id" TEXT NOT NULL,
    "centreId" TEXT,
    "type" "TypeEvenementCalendrier" NOT NULL,
    "titre" TEXT NOT NULL,
    "dateDebut" DATE NOT NULL,
    "dateFin" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evenements_calendrier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "evenements_calendrier_centreId_idx" ON "evenements_calendrier"("centreId");

-- CreateIndex
CREATE INDEX "evenements_calendrier_dateDebut_dateFin_idx" ON "evenements_calendrier"("dateDebut", "dateFin");

-- CreateIndex
CREATE INDEX "eleves_parentUserId_idx" ON "eleves"("parentUserId");

-- AddForeignKey
ALTER TABLE "evenements_calendrier" ADD CONSTRAINT "evenements_calendrier_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
