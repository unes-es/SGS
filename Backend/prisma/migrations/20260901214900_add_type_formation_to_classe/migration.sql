-- CreateEnum
CREATE TYPE "TypeFormation" AS ENUM ('JOUR', 'SOIR', 'WEEKEND', 'HYBRIDE', 'INTENSIF');

-- AlterTable
ALTER TABLE "classes" ADD COLUMN     "typeFormation" "TypeFormation" NOT NULL DEFAULT 'JOUR';

-- CreateIndex
CREATE INDEX "classes_typeFormation_idx" ON "classes"("typeFormation");
