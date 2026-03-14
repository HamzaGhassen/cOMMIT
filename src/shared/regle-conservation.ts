import { TypeDocument } from 'src/shared/type-document';
import { Etat } from './etat';

export enum DecisionFinale {
  CONSERVER = 'CONSERVER',
  DETRUIRE = 'DETRUIRE',
  TRIER = 'TRIER'
}

export interface RegleConservation {
  id: number;
  actif: number; // durée en années pour la phase active
  semi_actif: number; // durée en années pour la phase semi-active
  infini: boolean; // true si conservation infinie
  decisionFinal: DecisionFinale;
  typeDocument?: TypeDocument; // Relation avec TypeDocument (now using title field)
  estValide?: boolean;
  dateInvalidation?: Date;
  etats?: Etat[]; // Liste des états
}

// For display with more context
export interface RegleConservationWithDetails extends RegleConservation {
  typeDocumentTitre?: string; // For displaying the type document title (maps to backend title)
  dureeTotale: string; // Formatted duration for display
  statut: 'Actif' | 'Inactif'; // Calculated based on states
}