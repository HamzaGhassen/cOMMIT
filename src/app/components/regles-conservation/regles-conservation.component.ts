import { Component, OnInit } from '@angular/core';
import { RegleConservationService } from '../../services/regle-conservation.service';
import { RegleConservation, RegleConservationWithDetails, DecisionFinale } from 'src/shared/regle-conservation';
import { TypeDocument } from 'src/shared/type-document';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-regles-conservation',
  templateUrl: './regles-conservation.component.html',
  styleUrls: ['./regles-conservation.component.scss']
})
export class ReglesConservationComponent implements OnInit {
  regles: RegleConservationWithDetails[] = [];
  filteredRegles: RegleConservationWithDetails[] = [];
  loading = true;

  // Filter properties - Changed to string | '' to handle select binding properly
  selectedTypeDocumentId: string = ''; // Changed from number | '' to string
  selectedStatut: 'Valide' | 'Invalide' | '' = '';
  selectedDecisionFinale: DecisionFinale | '' = '';

  // For dropdown options
  typesDocument: TypeDocument[] = [];
  statuts: string[] = ['Valide', 'Invalide'];
  decisionsFinales: DecisionFinale[] = Object.values(DecisionFinale);

  // For expanded details
  expandedRegleId: number | null = null;

  // Add Regle Modal
  displayAddModal: boolean = false;
  newRegle: RegleConservation = this.initNewRegle();

  // Details Modal
  displayDetailsModal: boolean = false;
  selectedDetailedRegle: RegleConservationWithDetails | null = null;

  // Add Type Modal
  displayTypeModal: boolean = false;
  newType: TypeDocument = { id: 0, title: '' };

  constructor(
    private regleService: RegleConservationService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadRegles();
    this.loadTypesDocument();
  }

  loadRegles(): void {
    this.loading = true;
    this.regleService.getReglesWithDetails().subscribe({
      next: (data) => {
        // Sort: Valid first, then Invalid
        this.regles = data.sort((a, b) => {
          if (a.estValide === b.estValide) return 0;
          return a.estValide ? -1 : 1;
        });
        this.filteredRegles = [...this.regles];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading regles:', error);
        this.loading = false;
      }
    });
  }

  loadTypesDocument(): void {
    this.regleService.getTypesDocument().subscribe({
      next: (data) => {
        this.typesDocument = data;
      },
      error: (error) => {
        console.error('Error loading types document:', error);
      }
    });
  }

  applyFilters(): void {
    this.filteredRegles = this.regles.filter(regle => {
      // Type document filter - FIXED with proper type conversion
      let matchesTypeDocument = true;
      if (this.selectedTypeDocumentId !== '') {
        // Convert both to numbers for safe comparison
        const regleTypeId = regle.typeDocument?.id;
        const selectedId = Number(this.selectedTypeDocumentId);

        // Check if regleTypeId exists and compare as numbers
        matchesTypeDocument = regleTypeId !== undefined && regleTypeId === selectedId;
      }

      // Statut filter
      let matchesStatut = true;
      if (this.selectedStatut !== '') {
        const targetStatut = this.selectedStatut === 'Valide';
        matchesStatut = regle.estValide === targetStatut;
      }

      // Decision filter
      let matchesDecision = true;
      if (this.selectedDecisionFinale !== '') {
        matchesDecision = regle.decisionFinal === this.selectedDecisionFinale;
      }

      return matchesTypeDocument && matchesStatut && matchesDecision;
    });
  }

  clearFilters(): void {
    this.selectedTypeDocumentId = '';
    this.selectedStatut = '';
    this.selectedDecisionFinale = '';
    this.filteredRegles = this.regles;
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedTypeDocumentId || this.selectedStatut || this.selectedDecisionFinale);
  }

  getTypeDocumentName(typeId: string): string {
    if (!typeId) return '';
    const id = Number(typeId); // Convert string to number for lookup
    const type = this.typesDocument.find(t => t.id === id);
    return type ? type.title : '';
  }

  getStatutClass(regle: RegleConservation): string {
    return regle.estValide ? 'badge-success' : 'badge-warning';
  }

  getStatutLabel(regle: RegleConservation): string {
    return regle.estValide ? 'Valide' : 'Invalide';
  }

  getDecisionLabel(decision: DecisionFinale | string): string {
    switch (decision) {
      case DecisionFinale.CONSERVER:
      case 'CONSERVER':
        return 'Conserver';
      case DecisionFinale.DETRUIRE:
      case 'DETRUIRE':
        return 'Détruire';
      case DecisionFinale.TRIER:
      case 'TRIER':
        return 'Trier';
      default:
        return decision;
    }
  }

  getDecisionClass(decision: DecisionFinale | string): string {
    switch (decision) {
      case DecisionFinale.CONSERVER:
      case 'CONSERVER':
        return 'badge-info';
      case DecisionFinale.DETRUIRE:
      case 'DETRUIRE':
        return 'badge-danger';
      case DecisionFinale.TRIER:
      case 'TRIER':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  formatDuree(annees: number): string {
    if (annees === 0) return '0 an';
    if (annees === 1) return '1 an';
    return `${annees} ans`;
  }

  showDetails(regle: RegleConservationWithDetails): void {
    this.selectedDetailedRegle = regle;
    this.displayDetailsModal = true;
  }

  getNombreTotalRegles(): number {
    return this.regles.length;
  }

  getNombreActif(): number {
    return this.regles.filter(r => r.estValide).length;
  }

  // --- Add Rule Methods ---

  initNewRegle(): RegleConservation {
    return {
      id: 0,
      actif: 0,
      semi_actif: 0,
      infini: false,
      decisionFinal: DecisionFinale.CONSERVER,
      typeDocument: undefined,
      estValide: true
    };
  }

  showAddModal(): void {
    this.newRegle = this.initNewRegle();
    this.displayAddModal = true;
  }

  saveNewRegle(): void {
    if (!this.newRegle.typeDocument || !this.newRegle.typeDocument.id) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Veuillez choisir un type de document' });
      return;
    }

    this.regleService.createRegle(this.newRegle).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Règle ajoutée avec succès' });
        this.displayAddModal = false;
        this.loadRegles();
      },
      error: (err) => {
        if (err.status === 409) {
          this.messageService.add({ 
            severity: 'warn', 
            summary: 'Attention', 
            detail: 'u cant add this regle while there is one already valide' 
          });
        } else {
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de l\'ajout de la règle' });
        }
        console.error('Error saving regle:', err);
      }
    });
  }

  // --- Type Document Methods ---

  showTypeModal(): void {
    this.newType = { id: 0, title: '' };
    this.displayTypeModal = true;
  }

  saveNewType(): void {
    if (!this.newType.title) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Le titre est obligatoire' });
      return;
    }

    this.regleService.saveTypeDocument(this.newType).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Type de document créé' });
        this.loadTypesDocument();
        this.newRegle.typeDocument = res;
        this.displayTypeModal = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Ce type existe déjà' });
        console.error('Error saving type:', err);
      }
    });
  }

  invalidate(id: number): void {
    this.regleService.invalidateRegle(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Règle invalidée avec succès' });
        this.loadRegles();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de l\'invalidation' });
        console.error('Error invalidating regle:', err);
      }
    });
  }
}