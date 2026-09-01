-- CreateEnum
CREATE TYPE "TypeCandidatureDocument" AS ENUM ('CIN', 'DIPLOME', 'PHOTO', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeEvenementCandidature" AS ENUM ('MESSAGE', 'STATUT_CHANGE');

-- CreateTable
CREATE TABLE "candidature_documents" (
    "id" TEXT NOT NULL,
    "candidatureId" TEXT NOT NULL,
    "type" "TypeCandidatureDocument" NOT NULL,
    "nomFichier" TEXT NOT NULL,
    "fichierUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidature_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidature_evenements" (
    "id" TEXT NOT NULL,
    "candidatureId" TEXT NOT NULL,
    "type" "TypeEvenementCandidature" NOT NULL DEFAULT 'MESSAGE',
    "auteurId" TEXT,
    "auteurRole" TEXT,
    "message" TEXT NOT NULL,
    "ancienStatut" "StatutCandidature",
    "nouveauStatut" "StatutCandidature",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidature_evenements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidature_documents_candidatureId_idx" ON "candidature_documents"("candidatureId");

-- CreateIndex
CREATE INDEX "candidature_evenements_candidatureId_idx" ON "candidature_evenements"("candidatureId");

-- AddForeignKey
ALTER TABLE "candidature_documents" ADD CONSTRAINT "candidature_documents_candidatureId_fkey" FOREIGN KEY ("candidatureId") REFERENCES "candidatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidature_evenements" ADD CONSTRAINT "candidature_evenements_candidatureId_fkey" FOREIGN KEY ("candidatureId") REFERENCES "candidatures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
