require('dotenv').config()
const bcrypt = require('bcrypt')
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding...')

  // ── CENTRES ──
  const casa = await prisma.centre.create({ data: {
    nom: 'SGS Casablanca', slug: 'casablanca',
    ville: 'Casablanca', email: 'contact@sgs-casa.ma',
    telephone: '05 22 00 00 01'
  }})
  const rabat = await prisma.centre.create({ data: {
    nom: 'SGS Rabat', slug: 'rabat',
    ville: 'Rabat', email: 'contact@sgs-rabat.ma',
    telephone: '05 37 00 00 02'
  }})

  // ── UTILISATEURS ──
  const hash = await bcrypt.hash('admin123', 12)
  const hashUser = await bcrypt.hash('user123', 12)

  const admin = await prisma.utilisateur.create({ data: {
    centreId: casa.id, email: 'admin@sgs.ma',
    passwordHash: hash, role: 'SUPER_ADMIN',
    prenom: 'Ahmed', nom: 'Directeur'
  }})
  const secretaire = await prisma.utilisateur.create({ data: {
    centreId: casa.id, email: 'secretaire@sgs.ma',
    passwordHash: hashUser, role: 'SECRETAIRE',
    prenom: 'Khalid', nom: 'Moussaoui'
  }})
  const profUser = await prisma.utilisateur.create({ data: {
    centreId: casa.id, email: 'prof@sgs.ma',
    passwordHash: hashUser, role: 'PROFESSEUR',
    prenom: 'Amine', nom: 'Benkirane'
  }})

  // ── FILIERES ──
  const btsInfo = await prisma.filiere.create({ data: {
    centreId: casa.id, nom: 'BTS Informatique',
    code: 'BTS-INFO', dureeMois: 24,
    fraisInscription: 800, fraisScolarite: 3600
  }})
  const licGestion = await prisma.filiere.create({ data: {
    centreId: casa.id, nom: 'Licence Gestion',
    code: 'LIC-GEST', dureeMois: 36,
    fraisInscription: 800, fraisScolarite: 3200
  }})

  // ── MATIERES ──
  const maths = await prisma.matiere.create({ data: {
    filiereId: btsInfo.id, nom: 'Mathématiques',
    code: 'MATH', coefficient: 3
  }})
  const algo = await prisma.matiere.create({ data: {
    filiereId: btsInfo.id, nom: 'Algorithmique',
    code: 'ALGO', coefficient: 4
  }})
  const anglais = await prisma.matiere.create({ data: {
    filiereId: btsInfo.id, nom: 'Anglais',
    code: 'ANG', coefficient: 2
  }})

  // ── CLASSES ──
  const classe1 = await prisma.classe.create({ data: {
    filiereId: btsInfo.id, centreId: casa.id,
    nom: 'BTS-INFO-1A', anneeScolaire: '2025-2026',
    capaciteMax: 30, salle: 'Salle A1'
  }})
  const classe2 = await prisma.classe.create({ data: {
    filiereId: btsInfo.id, centreId: casa.id,
    nom: 'BTS-INFO-2A', anneeScolaire: '2025-2026',
    capaciteMax: 30, salle: 'Salle B1'
  }})

  // ── PERSONNEL ──
  const prof = await prisma.personnel.create({ data: {
    utilisateurId: profUser.id, centreId: casa.id,
    typeContrat: 'PERMANENT', poste: 'Professeur principal',
    dateEmbauche: new Date('2022-09-01'),
    salaireBase: 8500
  }})

  // ── EMPLOIS DU TEMPS ──
  await prisma.emploiDuTemps.create({ data: {
    classeId: classe1.id, matiereId: maths.id,
    professeurId: prof.id, jourSemaine: 'LUNDI',
    heureDebut: '08:00', heureFin: '10:00', salle: 'Salle A1'
  }})
  await prisma.emploiDuTemps.create({ data: {
    classeId: classe1.id, matiereId: algo.id,
    professeurId: prof.id, jourSemaine: 'MARDI',
    heureDebut: '10:00', heureFin: '12:00', salle: 'Labo'
  }})

  // ── ELEVES ──
  const userYasmine = await prisma.utilisateur.create({ data: {
    centreId: casa.id, email: 'yasmine@sgs.ma',
    passwordHash: hashUser, role: 'PARENT',
    prenom: 'Yasmine', nom: 'Alaoui', telephone: '06 00 00 00 01'
  }})
  const userOmar = await prisma.utilisateur.create({ data: {
    centreId: casa.id, email: 'omar@sgs.ma',
    passwordHash: hashUser, role: 'PARENT',
    prenom: 'Omar', nom: 'Rachidi', telephone: '06 00 00 00 02'
  }})

  const yasmine = await prisma.eleve.create({ data: {
    utilisateurId: userYasmine.id, classeId: classe1.id,
    centreId: casa.id, matricule: 'MAT-2026-0001',
    dateNaissance: new Date('2002-05-15'),
    dateInscription: new Date('2025-09-01'),
    cin: 'AB123456', nomParent: 'Mohamed Alaoui',
    telParent: '06 11 00 00 01'
  }})
  const omar = await prisma.eleve.create({ data: {
    utilisateurId: userOmar.id, classeId: classe2.id,
    centreId: casa.id, matricule: 'MAT-2026-0002',
    dateNaissance: new Date('2001-08-22'),
    dateInscription: new Date('2025-09-01'),
    cin: 'CD789012', nomParent: 'Hassan Rachidi',
    telParent: '06 11 00 00 02'
  }})

  // ── ABSENCES ──
  await prisma.absence.create({ data: {
    eleveId: yasmine.id, matiereId: maths.id,
    saisiePar: profUser.id,
    dateAbsence: new Date('2026-01-15'),
    type: 'SEANCE', estJustifiee: false
  }})
  await prisma.absence.create({ data: {
    eleveId: omar.id,
    saisiePar: profUser.id,
    dateAbsence: new Date('2026-01-20'),
    type: 'JOURNEE', estJustifiee: true, motif: 'Maladie'
  }})

  // ── NOTES ──
  await prisma.note.create({ data: {
    eleveId: yasmine.id, matiereId: maths.id,
    saisiePar: profUser.id, periode: 'T1',
    typeEval: 'CONTROLE', note: 16.5,
    dateEval: new Date('2025-11-10')
  }})
  await prisma.note.create({ data: {
    eleveId: yasmine.id, matiereId: algo.id,
    saisiePar: profUser.id, periode: 'T1',
    typeEval: 'EXAMEN', note: 18,
    dateEval: new Date('2025-12-01')
  }})
  await prisma.note.create({ data: {
    eleveId: omar.id, matiereId: maths.id,
    saisiePar: profUser.id, periode: 'T1',
    typeEval: 'CONTROLE', note: 12,
    dateEval: new Date('2025-11-10')
  }})

  // ── CAISSES ──
  const caisse = await prisma.caisse.create({ data: {
    centreId: casa.id, nom: 'Caisse principale',
    soldeActuel: 50000, devise: 'MAD'
  }})

  // ── PAIEMENTS ──
  await prisma.paiementEleve.create({ data: {
    eleveId: yasmine.id, caisseId: caisse.id,
    encaissePar: secretaire.id,
    typeFrais: 'INSCRIPTION', montant: 800,
    modePaiement: 'ESPECES',
    datePaiement: new Date('2025-09-01'),
    reference: 'REC-2026-0001'
  }})
  await prisma.paiementEleve.create({ data: {
    eleveId: yasmine.id, caisseId: caisse.id,
    encaissePar: secretaire.id,
    typeFrais: 'SCOLARITE', montant: 3600,
    modePaiement: 'VIREMENT',
    datePaiement: new Date('2025-10-01'),
    reference: 'REC-2026-0002',
    periodeMois: 10, periodeAnnee: 2025
  }})

  // ── BONS DE CAISSE ──
  await prisma.bonCaisse.create({ data: {
    caisseId: caisse.id, creePar: admin.id,
    numero: 'BC-0001', type: 'SORTIE',
    montant: 450, motif: 'Achat fournitures',
    dateOperation: new Date('2026-01-10')
  }})

  // ── SALAIRES ──
  await prisma.salaire.create({ data: {
    personnelId: prof.id, centreId: casa.id,
    mois: 1, annee: 2026,
    montantBrut: 8500, montantNet: 8500,
    modePaiement: 'VIREMENT', statut: 'PAYE',
    datePaiement: new Date('2026-01-31')
  }})

  // ── DOCUMENTS ──
  await prisma.document.create({ data: {
    eleveId: yasmine.id, generePar: secretaire.id,
    type: 'ATTESTATION_SCOLARITE',
    titre: 'Attestation de scolarité 2025-2026',
    fichierUrl: '/documents/ATT-2026-0001.pdf',
    anneeScolaire: '2025-2026',
    numeroSerie: 'ATT-2026-0001'
  }})

  console.log('✅ Seed complete')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())