import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

export interface Box {
  id: string;
  dossiers: number;
  contenu?: string[];
}

export interface Epi {
  id: string;
  name: string;
  dossiers: number;
  occupation: number;
  couleur: string;
  boxes: Box[];
}

@Component({
  selector: 'app-archive',
  templateUrl: './archive.component.html',
  styleUrls: ['./archive.component.scss'],
  providers: [MessageService]
})
export class ArchiveComponent implements OnInit {
  // Données des épis
  epis: Epi[] = [
    {
      id: 'ÉPI-01',
      name: 'Épi Principal A',
      dossiers: 234,
      occupation: 78,
      couleur: '#4f46e5',
      boxes: [
        { id: 'B-001', dossiers: 45, contenu: ['Document 2024-001', 'Document 2024-002', 'Rapport annuel'] },
        { id: 'B-002', dossiers: 32, contenu: ['Factures 2024', 'Contrats', 'Avenants'] },
        { id: 'B-003', dossiers: 28, contenu: ['Correspondance', 'Notes de service'] },
        { id: 'B-004', dossiers: 41, contenu: ['Dossiers RH', 'Formulaires'] },
        { id: 'B-005', dossiers: 53, contenu: ['Archives 2023', 'Rapports mensuels'] },
        { id: 'B-006', dossiers: 35, contenu: ['Documents techniques', 'Plans'] }
      ]
    },
    {
      id: 'ÉPI-02',
      name: 'Épi Secondaire B',
      dossiers: 156,
      occupation: 52,
      couleur: '#059669',
      boxes: [
        { id: 'B-007', dossiers: 23, contenu: ['Dossiers clients', 'Projets'] },
        { id: 'B-008', dossiers: 31, contenu: ['Documentation', 'Manuels'] },
        { id: 'B-009', dossiers: 19, contenu: ['Archives 2022'] },
        { id: 'B-010', dossiers: 42, contenu: ['Rapports d\'activité', 'Bilans'] },
        { id: 'B-011', dossiers: 41, contenu: ['Correspondance administrative'] }
      ]
    },
    {
      id: 'ÉPI-03',
      name: 'Épi Central C',
      dossiers: 312,
      occupation: 89,
      couleur: '#b45309',
      boxes: [
        { id: 'B-012', dossiers: 67, contenu: ['Dossiers prioritaires', 'Urgents'] },
        { id: 'B-013', dossiers: 54, contenu: ['Projets en cours'] },
        { id: 'B-014', dossiers: 48, contenu: ['Documents légaux', 'Contrats'] },
        { id: 'B-015', dossiers: 72, contenu: ['Archives sensibles'] },
        { id: 'B-016', dossiers: 71, contenu: ['Rapports confidentiels'] }
      ]
    },
    {
      id: 'ÉPI-04',
      name: 'Épi Archive D',
      dossiers: 98,
      occupation: 33,
      couleur: '#7c3aed',
      boxes: [
        { id: 'B-017', dossiers: 24, contenu: ['Archives 2021'] },
        { id: 'B-018', dossiers: 31, contenu: ['Documents historiques'] },
        { id: 'B-019', dossiers: 43, contenu: ['Anciens dossiers'] }
      ]
    },
    {
      id: 'ÉPI-05',
      name: 'Épi Document E',
      dossiers: 187,
      occupation: 62,
      couleur: '#db2777',
      boxes: [
        { id: 'B-020', dossiers: 38, contenu: ['Documents numériques'] },
        { id: 'B-021', dossiers: 45, contenu: ['Fichiers PDF', 'Scans'] },
        { id: 'B-022', dossiers: 52, contenu: ['Archives numériques'] },
        { id: 'B-023', dossiers: 52, contenu: ['Backups'] }
      ]
    },
    {
      id: 'ÉPI-06',
      name: 'Épi Stock F',
      dossiers: 143,
      occupation: 48,
      couleur: '#ea580c',
      boxes: [
        { id: 'B-024', dossiers: 29, contenu: ['Stock A'] },
        { id: 'B-025', dossiers: 34, contenu: ['Stock B'] },
        { id: 'B-026', dossiers: 41, contenu: ['Stock C'] },
        { id: 'B-027', dossiers: 39, contenu: ['Stock D'] }
      ]
    }
  ];

  selectedEpi: Epi | null = null;
  selectedBox: Box | null = null;
  showBoxDetail: boolean = false;
  searchQuery: string = '';
  viewMode: 'grid' | 'list' = 'grid';

  constructor(
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {}

  // ===== GESTION DES ÉPIS =====
  selectEpi(epi: Epi): void {
    this.selectedEpi = epi;
    this.selectedBox = null;
    this.showBoxDetail = false;
  }

  backToEpis(): void {
    this.selectedEpi = null;
    this.selectedBox = null;
    this.showBoxDetail = false;
  }

  // ===== GESTION DES BOÎTES =====
  selectBox(box: Box): void {
    this.selectedBox = box;
    this.showBoxDetail = true;
  }

  backToBoxes(): void {
    this.showBoxDetail = false;
    this.selectedBox = null;
  }

  // ===== ACTIONS =====
  viewDetails(epi: Epi): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Détails',
      detail: `Affichage des détails de ${epi.name}`,
      life: 2000
    });
  }

  viewMap(epi: Epi): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Carte',
      detail: `Localisation de ${epi.name}`,
      life: 2000
    });
  }

  viewStats(epi: Epi): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Statistiques',
      detail: `Statistiques de ${epi.name}`,
      life: 2000
    });
  }

  viewFullScreen(epi: Epi): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Plein écran',
      detail: `Mode plein écran pour ${epi.name}`,
      life: 2000
    });
  }

  // ===== RECHERCHE =====
  get filteredEpis(): Epi[] {
    if (!this.searchQuery) return this.epis;
    
    const query = this.searchQuery.toLowerCase();
    return this.epis.filter(epi => 
      epi.name.toLowerCase().includes(query) || 
      epi.id.toLowerCase().includes(query) ||
      epi.boxes.some(box => box.id.toLowerCase().includes(query))
    );
  }

  // ===== NAVIGATION =====
  goToEmplacements(): void {
    this.router.navigate(['/emplacements']);
  }

  // ===== COULEURS =====
  getOccupationColor(occupation: number): string {
    if (occupation >= 80) return '#ef4444';
    if (occupation >= 50) return '#f59e0b';
    return '#10b981';
  }
}