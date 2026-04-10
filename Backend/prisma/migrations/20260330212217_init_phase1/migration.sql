-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'DIRECTEUR', 'COMPTABLE', 'SECRETAIRE', 'PROFESSEUR', 'PARENT');

-- CreateEnum
CREATE TYPE "StatutEleve" AS ENUM ('ACTIF', 'SUSPENDU', 'DIPLOME', 'ABANDONNE', 'RADIE');

-- CreateEnum
CREATE TYPE "TypeContrat" AS ENUM ('VACATAIRE', 'PERMANENT', 'ADMINISTRATIF', 'STAGIAIRE');

-- CreateEnum
CREATE TYPE "TypeAbsence" AS ENUM ('JOURNEE', 'SEANCE');

-- CreateEnum
CREATE TYPE "TypeEval" AS ENUM ('CONTROLE', 'EXAMEN', 'TP', 'PROJET');

-- CreateEnum
CREATE TYPE "TypeFrais" AS ENUM ('INSCRIPTION', 'SCOLARITE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'VIREMENT', 'CHEQUE', 'EN_LIGNE');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('EN_ATTENTE', 'PAYE', 'PARTIEL', 'ANNULE');

-- CreateEnum
CREATE TYPE "TypeBonCaisse" AS ENUM ('ENTREE', 'SORTIE');

-- CreateEnum
CREATE TYPE "JourSemaine" AS ENUM ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI');

-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('ATTESTATION_SCOLARITE', 'RELEVE_NOTES', 'RECU_PAIEMENT', 'ATTESTATION_TRAVAIL', 'BULLETIN', 'FICHE_PAIE', 'AUTRE');

-- CreateTable
CREATE TABLE "centres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "adresse" TEXT,
    "ville" TEXT NOT NULL,
    "telephone" TEXT,
    "email" TEXT,
    "logoUrl" TEXT,
    "couleurPrimaire" TEXT DEFAULT '#2563eb',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "prenom" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "telephone" TEXT,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filieres" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "dureeMois" INTEGER NOT NULL,
    "fraisInscription" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fraisScolarite" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL,
    "capaciteMax" INTEGER NOT NULL DEFAULT 30,
    "niveau" TEXT,
    "salle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matieres" (
    "id" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "code" TEXT,
    "coefficient" DECIMAL(4,2) NOT NULL DEFAULT 1,
    "volumeHoraire" INTEGER,
    "estOptionnelle" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emplois_du_temps" (
    "id" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "professeurId" TEXT NOT NULL,
    "jourSemaine" "JourSemaine" NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "salle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emplois_du_temps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eleves" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "dateNaissance" DATE NOT NULL,
    "cin" TEXT,
    "adresse" TEXT,
    "nomParent" TEXT,
    "telParent" TEXT,
    "statut" "StatutEleve" NOT NULL DEFAULT 'ACTIF',
    "dateInscription" DATE NOT NULL,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eleves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absences" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "matiereId" TEXT,
    "saisiePar" TEXT NOT NULL,
    "dateAbsence" DATE NOT NULL,
    "type" "TypeAbsence" NOT NULL,
    "estJustifiee" BOOLEAN NOT NULL DEFAULT false,
    "motif" TEXT,
    "justificatifUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "saisiePar" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "typeEval" "TypeEval" NOT NULL,
    "note" DECIMAL(5,2) NOT NULL,
    "noteMax" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "appreciation" TEXT,
    "dateEval" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel" (
    "id" TEXT NOT NULL,
    "utilisateurId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "typeContrat" "TypeContrat" NOT NULL,
    "poste" TEXT NOT NULL,
    "dateEmbauche" DATE NOT NULL,
    "salaireBase" DECIMAL(10,2),
    "tauxHoraire" DECIMAL(8,2),
    "rib" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salaires" (
    "id" TEXT NOT NULL,
    "personnelId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "mois" INTEGER NOT NULL,
    "annee" INTEGER NOT NULL,
    "montantBrut" DECIMAL(10,2) NOT NULL,
    "deductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "montantNet" DECIMAL(10,2) NOT NULL,
    "modePaiement" "ModePaiement" NOT NULL,
    "datePaiement" DATE,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caisses" (
    "id" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "soldeActuel" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "devise" TEXT NOT NULL DEFAULT 'MAD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "responsableId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caisses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements_eleves" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "caisseId" TEXT NOT NULL,
    "encaissePar" TEXT NOT NULL,
    "typeFrais" "TypeFrais" NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "modePaiement" "ModePaiement" NOT NULL,
    "datePaiement" DATE NOT NULL,
    "reference" TEXT NOT NULL,
    "periodeMois" INTEGER,
    "periodeAnnee" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paiements_eleves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bons_caisse" (
    "id" TEXT NOT NULL,
    "caisseId" TEXT NOT NULL,
    "creePar" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "type" "TypeBonCaisse" NOT NULL,
    "montant" DECIMAL(10,2) NOT NULL,
    "motif" TEXT NOT NULL,
    "dateOperation" DATE NOT NULL,
    "justificatifUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bons_caisse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "generePar" TEXT NOT NULL,
    "type" "TypeDocument" NOT NULL,
    "titre" TEXT NOT NULL,
    "fichierUrl" TEXT NOT NULL,
    "anneeScolaire" TEXT,
    "numeroSerie" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "centres_slug_key" ON "centres"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE INDEX "utilisateurs_centreId_idx" ON "utilisateurs"("centreId");

-- CreateIndex
CREATE UNIQUE INDEX "filieres_code_key" ON "filieres"("code");

-- CreateIndex
CREATE INDEX "filieres_centreId_idx" ON "filieres"("centreId");

-- CreateIndex
CREATE INDEX "classes_filiereId_idx" ON "classes"("filiereId");

-- CreateIndex
CREATE INDEX "classes_centreId_idx" ON "classes"("centreId");

-- CreateIndex
CREATE INDEX "matieres_filiereId_idx" ON "matieres"("filiereId");

-- CreateIndex
CREATE INDEX "emplois_du_temps_classeId_idx" ON "emplois_du_temps"("classeId");

-- CreateIndex
CREATE INDEX "emplois_du_temps_matiereId_idx" ON "emplois_du_temps"("matiereId");

-- CreateIndex
CREATE UNIQUE INDEX "eleves_utilisateurId_key" ON "eleves"("utilisateurId");

-- CreateIndex
CREATE UNIQUE INDEX "eleves_matricule_key" ON "eleves"("matricule");

-- CreateIndex
CREATE INDEX "eleves_classeId_idx" ON "eleves"("classeId");

-- CreateIndex
CREATE INDEX "eleves_centreId_idx" ON "eleves"("centreId");

-- CreateIndex
CREATE INDEX "absences_eleveId_idx" ON "absences"("eleveId");

-- CreateIndex
CREATE INDEX "absences_dateAbsence_idx" ON "absences"("dateAbsence");

-- CreateIndex
CREATE INDEX "notes_eleveId_idx" ON "notes"("eleveId");

-- CreateIndex
CREATE INDEX "notes_matiereId_idx" ON "notes"("matiereId");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_utilisateurId_key" ON "personnel"("utilisateurId");

-- CreateIndex
CREATE INDEX "personnel_centreId_idx" ON "personnel"("centreId");

-- CreateIndex
CREATE INDEX "salaires_personnelId_idx" ON "salaires"("personnelId");

-- CreateIndex
CREATE INDEX "salaires_centreId_idx" ON "salaires"("centreId");

-- CreateIndex
CREATE INDEX "caisses_centreId_idx" ON "caisses"("centreId");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_eleves_reference_key" ON "paiements_eleves"("reference");

-- CreateIndex
CREATE INDEX "paiements_eleves_eleveId_idx" ON "paiements_eleves"("eleveId");

-- CreateIndex
CREATE INDEX "paiements_eleves_caisseId_idx" ON "paiements_eleves"("caisseId");

-- CreateIndex
CREATE UNIQUE INDEX "bons_caisse_numero_key" ON "bons_caisse"("numero");

-- CreateIndex
CREATE INDEX "bons_caisse_caisseId_idx" ON "bons_caisse"("caisseId");

-- CreateIndex
CREATE UNIQUE INDEX "documents_numeroSerie_key" ON "documents"("numeroSerie");

-- CreateIndex
CREATE INDEX "documents_eleveId_idx" ON "documents"("eleveId");

-- AddForeignKey
ALTER TABLE "utilisateurs" ADD CONSTRAINT "utilisateurs_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filieres" ADD CONSTRAINT "filieres_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matieres" ADD CONSTRAINT "matieres_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "filieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplois_du_temps" ADD CONSTRAINT "emplois_du_temps_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplois_du_temps" ADD CONSTRAINT "emplois_du_temps_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplois_du_temps" ADD CONSTRAINT "emplois_du_temps_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_saisiePar_fkey" FOREIGN KEY ("saisiePar") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_saisiePar_fkey" FOREIGN KEY ("saisiePar") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salaires" ADD CONSTRAINT "salaires_personnelId_fkey" FOREIGN KEY ("personnelId") REFERENCES "personnel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salaires" ADD CONSTRAINT "salaires_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caisses" ADD CONSTRAINT "caisses_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "centres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements_eleves" ADD CONSTRAINT "paiements_eleves_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements_eleves" ADD CONSTRAINT "paiements_eleves_caisseId_fkey" FOREIGN KEY ("caisseId") REFERENCES "caisses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements_eleves" ADD CONSTRAINT "paiements_eleves_encaissePar_fkey" FOREIGN KEY ("encaissePar") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bons_caisse" ADD CONSTRAINT "bons_caisse_caisseId_fkey" FOREIGN KEY ("caisseId") REFERENCES "caisses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bons_caisse" ADD CONSTRAINT "bons_caisse_creePar_fkey" FOREIGN KEY ("creePar") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_generePar_fkey" FOREIGN KEY ("generePar") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
