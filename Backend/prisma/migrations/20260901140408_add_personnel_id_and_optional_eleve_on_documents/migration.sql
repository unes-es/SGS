-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_eleveId_fkey";

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "personnelId" TEXT,
ALTER COLUMN "eleveId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
