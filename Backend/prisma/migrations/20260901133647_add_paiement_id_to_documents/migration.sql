-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "paiementId" TEXT;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_paiementId_fkey" FOREIGN KEY ("paiementId") REFERENCES "paiements_eleves"("id") ON DELETE SET NULL ON UPDATE CASCADE;
