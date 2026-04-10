-- CreateEnum
CREATE TYPE "StatutCandidature" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'ACCEPTEE', 'REFUSEE');

-- CreateTable
CREATE TABLE "candidatures" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "filiereId" TEXT,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "dateNaissance" DATE,
    "adresse" TEXT,
    "nomParent" TEXT,
    "telParent" TEXT,
    "message" TEXT,
    "statut" "StatutCandidature" NOT NULL DEFAULT 'EN_ATTENTE',
    "noteInterne" TEXT,
    "traitePar" TEXT,
    "traiteAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidatures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidatures_centreId_idx" ON "candidatures"("centreId");

-- CreateIndex
CREATE INDEX "candidatures_statut_idx" ON "candidatures"("statut");

-- AddForeignKey
ALTER TABLE "candidatures" ADD CONSTRAINT "candidatures_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatures" ADD CONSTRAINT "candidatures_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidatures" ADD CONSTRAINT "candidatures_traitePar_fkey" FOREIGN KEY ("traitePar") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
