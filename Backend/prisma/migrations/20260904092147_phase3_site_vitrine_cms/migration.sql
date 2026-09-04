-- CreateTable
CREATE TABLE "actualites" (
    "id" TEXT NOT NULL,
    "centreId" TEXT,
    "categorie" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "extrait" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "auteurId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actualites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements" (
    "id" TEXT NOT NULL,
    "centreId" TEXT,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lieu" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evenements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages_contact" (
    "id" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "sujet" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isTraite" BOOLEAN NOT NULL DEFAULT false,
    "traitePar" TEXT,
    "traiteAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "actualites_centreId_idx" ON "actualites"("centreId");

-- CreateIndex
CREATE INDEX "actualites_isPublished_publishedAt_idx" ON "actualites"("isPublished", "publishedAt");

-- CreateIndex
CREATE INDEX "evenements_centreId_idx" ON "evenements"("centreId");

-- CreateIndex
CREATE INDEX "evenements_isPublished_dateDebut_idx" ON "evenements"("isPublished", "dateDebut");

-- CreateIndex
CREATE INDEX "messages_contact_isTraite_idx" ON "messages_contact"("isTraite");

-- AddForeignKey
ALTER TABLE "actualites" ADD CONSTRAINT "actualites_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actualites" ADD CONSTRAINT "actualites_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements" ADD CONSTRAINT "evenements_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages_contact" ADD CONSTRAINT "messages_contact_traitePar_fkey" FOREIGN KEY ("traitePar") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
