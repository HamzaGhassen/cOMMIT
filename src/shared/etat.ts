export interface Etat {
  typeEtat: string; // ou un enum selon votre implémentation
  dateEtat: Date;
  valide: boolean;
}