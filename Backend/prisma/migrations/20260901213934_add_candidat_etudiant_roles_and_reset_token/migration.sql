-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CANDIDAT';
ALTER TYPE "Role" ADD VALUE 'ETUDIANT';

-- AlterTable
ALTER TABLE "utilisateurs" ADD COLUMN     "resetTokenHash" TEXT,
ADD COLUMN     "resetTokenExpires" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_resetTokenHash_key" ON "utilisateurs"("resetTokenHash");

-- AlterTable
ALTER TABLE "candidatures" ADD COLUMN     "candidatUserId" TEXT;

-- AddForeignKey
ALTER TABLE "candidatures" ADD CONSTRAINT "candidatures_candidatUserId_fkey" FOREIGN KEY ("candidatUserId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
