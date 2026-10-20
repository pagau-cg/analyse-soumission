export type ID = string;

export interface Projet {
  id: ID;
  numero: string;        // ex "24-042"
  nom: string;           // ex "Nouvel immeuble CG"
  estimateur?: string;
  createdAt: string;
}

export interface Lot {
  id: ID;
  projetId: ID;
  nom: string;           // ex "Murs rideaux et vitrages"
  specialite?: string;   // ex "08 44 13"
  devisRef?: string;     // texte libre : sections de devis attendues
  budget?: number;
  createdAt: string;
}

export interface Soumission {
  id: ID;
  lotId: ID;
  fichier: string;       // nom fichier original
  cheminPdf: string;     // chemin interne

  // Champs extraits par IA (structure volontairement courte)
  fournisseur?: string;
  dateSoumission?: string;
  prixAvantTaxes?: number;
  prixApresTaxes?: number;
  validiteJours?: number;
  signataire?: string;
  ingenieur?: boolean;
  inclusions?: string[];
  exclusions?: string[];
  referencesDevis?: string[];
  conditionsPaiement?: string;
  drapeauxRouges?: string[];  // auto-générés
  notesComplementaires?: string;

  statut: "attente_extraction" | "extrait" | "erreur";
  erreur?: string;
  createdAt: string;
  updatedAt?: string;
}
