-- CreateTable
CREATE TABLE "formation_tarifs" (
    "id" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "typeFormation" "TypeFormation" NOT NULL,
    "fraisScolarite" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formation_tarifs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "formation_tarifs_filiereId_typeFormation_key" ON "formation_tarifs"("filiereId", "typeFormation");

-- AddForeignKey
ALTER TABLE "formation_tarifs" ADD CONSTRAINT "formation_tarifs_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE CASCADE ON UPDATE CASCADE;
