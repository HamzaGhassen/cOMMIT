import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, forkJoin, Observable } from 'rxjs';
import { MessageService } from 'primeng/api';
import { HttpErrorResponse } from '@angular/common/http';
import { EmplacementService } from 'src/app/services/emplacement.service';
import { Emplacement } from 'src/shared/Emplacement';
import { TypeEmp } from 'src/app/enums/TypeEmp';


// Interfaces locales

interface Block {
  title: string;
  color: string;
  metrage?: number;
  _emplacementId?: string;
  _tabletteId?: string;
  deleted?: boolean;
}

interface Cell {
  isDragOver?: boolean;
  _tabletteId?: string;
  _traversId?: string;
  tabletteNumero?: string;
  tabletteMetrage?: number;
  blocs?: Block[];
  deleted?: boolean;
  _deletedTabletteNumero?: string;
}


// Composant principal


@Component({
  selector: 'app-emplacements',
  templateUrl: './emplacements.component.html',
  styleUrls: ['./emplacements.component.scss'],
  providers: [MessageService]
})
export class EmplacementsComponent implements OnInit, OnDestroy {

 

  Math = Math;

  // Vue active : liste ou matrice
  view: 'list' | 'matrix' = 'list';

  // Données chargées depuis le backend
  epies: Emplacement[] = [];
  selectedEpie: Emplacement | null = null;
  traversChildren: Emplacement[] = [];
  tabletteMap: Map<string, Emplacement[]> = new Map();
  blocMap: Map<string, Emplacement[]> = new Map();

  // États de chargement
  loading = false;
  loadingMatrix = false;
  private subscriptions: Subscription[] = [];

  // Dimensions et contenu de la matrice courante
  rows: number = 0;
  cols: number = 0;
  matrix: Cell[][] = [];

  // Ligne sélectionnée dans la matrice
  selectedRowIndex: number | null = null;

  // Visibilité des modales principales
  showAddEpiModal = false;
  showResizeModal = false;
  showEditEpiModal = false;
  showAddChoiceModal = false;
  showImportModal = false;

  // Import depuis un fichier Excel
  importFile: File | null = null;
  importing = false;

  // Données locales des épis créés manuellement (sans backend)
  _localEpieData: Map<string, { name: string; code: string; rows: number; cols: number }> = new Map();

  // Champs des modales épi
  newEpiTraversCount = 0;
  newEpiTablettesPerTravers = 0;
  newEpiBlocsPerTablette = 0;
  newEpiMetragePerBloc: number | null = null;

  tempRows: number = 0;
  tempCols: number = 0;

  editingEpi: Emplacement | null = null;
  editEpiName = '';
  editEpiCode = '';
  editEpiMetrage: number | null = null;

  // Vue détail d'une tablette
  showTabletteDetail = false;
  selectedTabletteCell: Cell | null = null;

  // Modal ajout/édition de bloc
  showBlocModal = false;
  newBlocTitle = '';
  newBlocColor = '#3b82f6';
  newBlocMetrage: number | null = null;
  isBlocEditMode = false;
  editingBlocInDetail: Block | null = null;

  // Modal édition d'une tablette
  showEditTabletteModal = false;
  editingTabletteCell: Cell | null = null;
  editTabletteNumero = '';
  editTabletteMetrage: number = 0;
  editTabletteRowIndex: number | null = null;
  editTabletteColIndex: number | null = null;

  // Modal édition d'un travers
  showEditTraversModal = false;
  editingTraversIndex: number | null = null;
  editTraversNumero = '';
  editTraversMetrage: number = 0;

  // Glisser-déposer des tablettes
  draggingCell: { r: number; c: number } | null = null;

  // Glisser-déposer des blocs
  draggingBlocIndex: number | null = null;
  draggingBlocTargetIndex: number | null = null;

  // Garde pour éviter un clic parasite après un glisser
  private _dragJustFinished = false;

  // Sélection multiple pour suppression groupée
  selectedTraversIds: Set<number> = new Set();    // indices de colonnes
  selectedTabletteKeys: Set<string> = new Set();  // clés "r-c"
  selectedBlocIds: Set<string> = new Set();       // ids ou clés d'index

  
  // Constructeur
  

  constructor(
    private emplacementService: EmplacementService,
    private messageService: MessageService
  ) {}

  
  // Cycle de vie
  

  ngOnInit(): void {
    this.loadEpies();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

 
  // Chargement des données
  
  loadEpies(): void {
    this.loading = true;
    this.subscriptions.push(
      this.emplacementService.getRoots().subscribe({
        next: (epies: Emplacement[]) => {
          this.epies = epies;
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur chargement epis:', error);
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger les emplacements',
            life: 5000
          });
        }
      })
    );
  }

 
  // Méthodes utilitaires
  

  generateMatrix(rows: number, cols: number): Cell[][] {
    const matrix: Cell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({ blocs: [] });
      }
      matrix.push(row);
    }
    return matrix;
  }

  get fillPercentage(): number {
    if (!this.matrix || !this.matrix.length) return 0;
    const total = this.rows * this.cols;
    if (total === 0) return 0;
    let filled = 0;
    this.matrix.forEach(row =>
      row.forEach(cell => {
        if (cell.blocs && cell.blocs.length > 0) filled++;
      })
    );
    return Math.round((filled / total) * 100);
  }

  getRandomColor(): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // couleur consistante
  getColorForId(id: string): string {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash;
    }
    return colors[Math.abs(hash) % colors.length];
  }

  
  // NAVIGATION
  

  openEpie(epie: Emplacement): void {
    this.selectedEpie = epie;
    this.view = 'matrix';
    this.tabletteMap.clear();
    this.blocMap.clear();

    // Épi local : création de la matrice en mémoire
    const localData = this._localEpieData.get(epie.id!);
    if (localData || epie.id?.startsWith('local-')) {
      const r = localData?.rows || 10;
      const c = localData?.cols || 8;
      this.rows = r;
      this.cols = c;
      this.traversChildren = [];
      for (let i = 0; i < c; i++) {
        this.traversChildren.push({
          id: `local-travers-${i}`,
          numero: `TRAV-${String(i + 1).padStart(2, '0')}`,
          type: TypeEmp.TRAVERS
        });
      }
      this.matrix = this.generateMatrix(r, c);
      // Numérotation locale des tablettes pour l'affichage
      for (let ri = 0; ri < r; ri++) {
        for (let ci = 0; ci < c; ci++) {
          this.matrix[ri][ci].tabletteNumero = `TAB${ri + 1}`;
          this.matrix[ri][ci]._traversId = `local-travers-${ci}`;
        }
      }
      this.loadingMatrix = false;
      return;
    }

    // Épi backend : chargement de la hiérarchie depuis l'API
    this.loadingMatrix = true;

    this.subscriptions.push(
      this.emplacementService.getChildren(epie.id!).subscribe({
        next: (travers: Emplacement[]) => {
          travers.sort((a, b) => (a.numero || '').localeCompare(b.numero || ''));
          this.traversChildren = travers;
          this.cols = travers.length;

          if (travers.length === 0) {
            this.loadingMatrix = false;
            this.rows = 0;
            this.matrix = [];
            return;
          }

          const tabletteRequests = travers.map(trav =>
            this.emplacementService.getChildren(trav.id!)
          );

          forkJoin(tabletteRequests).subscribe({
            next: (tabletteArrays: Emplacement[][]) => {
              let maxRows = 0;
              tabletteArrays.forEach((tabletteList, colIdx) => {
                tabletteList.sort((a, b) => (a.numero || '').localeCompare(b.numero || ''));
                this.tabletteMap.set(travers[colIdx].id!, tabletteList);
                if (tabletteList.length > maxRows) maxRows = tabletteList.length;
              });
              this.rows = maxRows;

              const allTablettes: Emplacement[] = [];
              tabletteArrays.forEach(list => allTablettes.push(...list));

              if (allTablettes.length === 0) {
                this.buildMatrixFromData();
                this.loadingMatrix = false;
                return;
              }

              const blocRequests = allTablettes.map(tab =>
                this.emplacementService.getChildren(tab.id!)
              );

              forkJoin(blocRequests).subscribe({
                next: (blocArrays: Emplacement[][]) => {
                  allTablettes.forEach((tab, idx) => {
                    const blocs = blocArrays[idx];
                    blocs.sort((a, b) => (a.numero || '').localeCompare(b.numero || ''));
                    this.blocMap.set(tab.id!, blocs);
                  });
                  this.buildMatrixFromData();
                  this.loadingMatrix = false;
                },
                error: () => {
                  this.buildMatrixFromData();
                  this.loadingMatrix = false;
                }
              });
            },
            error: (err) => {
              console.error('Erreur chargement tablettes:', err);
              this.loadingMatrix = false;
            }
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur chargement travers:', error);
          this.loadingMatrix = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Impossible de charger la matrice',
            life: 5000
          });
        }
      })
    );
  }

  buildMatrixFromData(): void {
    const matrix: Cell[][] = [];

    for (let r = 0; r < this.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < this.cols; c++) {
        const travers = this.traversChildren[c];
        const tabletteList = this.tabletteMap.get(travers.id!) || [];
        const tablette = tabletteList[r];

        if (tablette) {
          const emplacBlocs = this.blocMap.get(tablette.id!) || [];
          const blocs: Block[] = emplacBlocs.map(b => ({
            title: b.numero || '',
            color: this.getColorForId(b.id!),
            metrage: b.metrage,
            _emplacementId: b.id,
            _tabletteId: tablette.id
          }));
          row.push({
            _tabletteId: tablette.id,
            _traversId: travers.id,
            tabletteNumero: tablette.numero,
            tabletteMetrage: tablette.metrage ?? 0,
            blocs
          });
        } else {
          row.push({ blocs: [] });
        }
      }
      matrix.push(row);
    }

    this.matrix = matrix;
  }

  back(): void {
    this.view = 'list';
    this.selectedEpie = null;
    this.selectedRowIndex = null;
    this.traversChildren = [];
    this.tabletteMap.clear();
    this.blocMap.clear();
  }
  // CHOIX AJOUTER UN EMPLACEMENT
  

  openAddChoice(): void {
    this.showAddChoiceModal = true;
  }

  closeAddChoice(): void {
    this.showAddChoiceModal = false;
  }

  chooseImport(): void {
    this.showAddChoiceModal = false;
    this.showImportModal = true;
    this.importFile = null;
  }

  chooseManual(): void {
    this.showAddChoiceModal = false;
    this.openAddEpiModal();
  }

 
  // IMPORT EXCEL


  onFileSelect(event: any): void {
    this.importFile = event.files ? event.files[0] : event.target?.files?.[0];
  }

  submitImport(): void {
    if (!this.importFile) return;
    this.importing = true;

    this.subscriptions.push(
      this.emplacementService.importExcel(this.importFile).subscribe({
        next: () => {
          this.importing = false;
          this.showImportModal = false;
          this.importFile = null;
          this.loadEpies();
          this.messageService.add({
            severity: 'success',
            summary: 'Import réussi',
            detail: 'Le fichier Excel a été importé avec succès.',
            life: 3000
          });
        },
        error: (error: HttpErrorResponse) => {
          this.importing = false;
          console.error('Erreur import:', error);
          const detail =
            (error?.error && typeof error.error === 'object' && (error.error as any).message) ||
            (typeof error?.error === 'string' ? error.error : null) ||
            error?.message ||
            "Échec de l'import Excel.";
          this.messageService.add({
            severity: 'error',
            summary: 'Import échoué',
            detail,
            life: 5000
          });
        }
      })
    );
  }

  closeImportModal(): void {
    this.showImportModal = false;
    this.importFile = null;
  }

  /** Télécharge le fichier Excel modèle depuis le back. */
  downloadTemplate(): void {
    this.subscriptions.push(
      this.emplacementService.downloadTemplate().subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'emplacements_modele.xlsx';
          a.click();
          window.URL.revokeObjectURL(url);
          this.messageService.add({
            severity: 'success',
            summary: 'Téléchargement prêt',
            detail: 'Le modèle Excel a été téléchargé.',
            life: 3000
          });
        },
        error: (err: HttpErrorResponse) => {
          console.error('Erreur téléchargement modèle:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Téléchargement échoué',
            detail: 'Impossible de télécharger le modèle Excel.',
            life: 5000
          });
        }
      })
    );
  }

  // Gestion des épis (CRUD)

  openAddEpiModal(): void {
    this.showAddEpiModal = true;
    this.newEpiTraversCount = 5;
    this.newEpiTablettesPerTravers = 6;
    this.newEpiBlocsPerTablette = 8;
    this.newEpiMetragePerBloc = 10;
  }
zz
  addEpi(): void {
    if (!this.newEpiTraversCount || !this.newEpiTablettesPerTravers ||
        !this.newEpiBlocsPerTablette || !this.newEpiMetragePerBloc) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez remplir tous les champs obligatoires',
        life: 3000
      });
      return;
    }

    if (this.newEpiBlocsPerTablette > 8) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Le nombre de blocs par tablette ne peut pas depasser 8',
        life: 5000
      });
      return;
    }

    // Auto-generate epi numero: scan max existing to avoid collisions
    const epiNum = this.getNextEpiNum();
    const epiNumero = `${epiNum}000`;

    const epie: Emplacement = {
      numero: epiNumero,
      type: TypeEmp.EPIE,
      metrage: 0
    };

    this.loading = true;
    this.subscriptions.push(
      this.emplacementService.createRoot(epie).subscribe({
        next: (createdEpie) => {
          // Step 1: Create travers
          const traversRequests = Array.from(
            { length: this.newEpiTraversCount }, (_, i) =>
            this.emplacementService.createChild(createdEpie.id!, {
              numero: `${epiNum}${i + 1}00`,
              type: TypeEmp.TRAVERS,
              metrage: 0
            })
          );

          forkJoin(traversRequests).subscribe({
            next: (createdTravers) => {
              // Step 2: Create tablettes (per-travers numbering, 1-9)
              const tabletteRequests: Observable<Emplacement>[] = [];
              const tabletteTraversIndices: { traversIdx: number; tabIdx: number }[] = [];

              createdTravers.forEach((trav, traversIdx) => {
                for (let t = 1; t <= this.newEpiTablettesPerTravers; t++) {
                  const tabNumero = `${epiNum}${traversIdx + 1}${t}0`;
                  tabletteRequests.push(
                    this.emplacementService.createChild(trav.id!, {
                      numero: tabNumero,
                      type: TypeEmp.TABLETTE,
                      metrage: 0
                    })
                  );
                  tabletteTraversIndices.push({ traversIdx: traversIdx + 1, tabIdx: t });
                }
              });

              forkJoin(tabletteRequests).subscribe({
                next: (createdTablettes) => {
                  // Step 3: Create blocs under each tablette
                  const blocRequests: Observable<Emplacement>[] = [];

                  createdTablettes.forEach((tab, idx) => {
                    const { traversIdx, tabIdx } = tabletteTraversIndices[idx];
                    for (let b = 1; b <= this.newEpiBlocsPerTablette; b++) {
                      const blocNumero = `${epiNum}${traversIdx}${tabIdx}${b}`;
                      blocRequests.push(
                        this.emplacementService.createChild(tab.id!, {
                          numero: blocNumero,
                          type: TypeEmp.BLOC,
                          metrage: this.newEpiMetragePerBloc ?? 0
                        })
                      );
                    }
                  });

                  if (blocRequests.length === 0) {
                    this.finishEpiCreation();
                    return;
                  }

                  forkJoin(blocRequests).subscribe({
                    next: () => this.finishEpiCreation(),
                    error: () => {
                      this.loading = false;
                      this.messageService.add({
                        severity: 'error',
                        summary: 'Erreur',
                        detail: 'Erreur lors de la creation des blocs',
                        life: 5000
                      });
                    }
                  });
                },
                error: () => {
                  this.loading = false;
                  this.messageService.add({
                    severity: 'error',
                    summary: 'Erreur',
                    detail: 'Erreur lors de la creation des tablettes',
                    life: 5000
                  });
                }
              });
            },
            error: () => {
              this.loading = false;
              this.messageService.add({
                severity: 'error',
                summary: 'Erreur',
                detail: 'Erreur lors de la creation des travers',
                life: 5000
              });
            }
          });
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: "Erreur lors de la creation de l'epi",
            life: 5000
          });
        }
      })
    );
  }

  private finishEpiCreation(): void {
    this.loading = false;
    this.showAddEpiModal = false;
    this.loadEpies();
    this.messageService.add({
      severity: 'success',
      summary: 'Succes',
      detail: 'Epi cree avec succes (avec travers, tablettes et blocs)',
      life: 3000
    });
  }

  private getNextEpiNum(): string {
    let maxNum = 0;
    this.epies.forEach(e => {
      if (e.numero && e.numero.length === 5) {
        const num = parseInt(e.numero.substring(0, 2), 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    });
    return String(maxNum + 1).padStart(2, '0');
  }

  closeAddEpiModal(): void {
    this.showAddEpiModal = false;
  }

  openEditEpiModal(epie: Emplacement, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.editingEpi = epie;
    this.editEpiName = epie.numero || '';
    this.editEpiMetrage = epie.metrage || null;
    this.showEditEpiModal = true;
  }

  updateEpi(): void {
    if (!this.editingEpi || !this.editEpiName) return;

    if (this.editingEpi.id?.startsWith('local-')) {
      this.editingEpi.numero = this.editEpiName;
      this.editingEpi.metrage = this.editEpiMetrage || undefined;
      if (this.selectedEpie?.id === this.editingEpi.id) {
        this.selectedEpie.numero = this.editEpiName;
        this.selectedEpie.metrage = this.editEpiMetrage || undefined;
      }
      this.closeEditEpiModal();
      this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Emplacement modifie', life: 3000 });
      return;
    }

    if (!this.editingEpi.id) return;

    const updated: Emplacement = {
      ...this.editingEpi,
      numero: this.editEpiName,
      metrage: this.editEpiMetrage || undefined
    };

    this.subscriptions.push(
      this.emplacementService.update(this.editingEpi.id, updated).subscribe({
        next: () => {
          this.closeEditEpiModal();
          this.loadEpies();
          if (this.selectedEpie?.id === this.editingEpi?.id) {
            this.selectedEpie!.numero = this.editEpiName;
            this.selectedEpie!.metrage = this.editEpiMetrage || undefined;
          }
          this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Emplacement modifie', life: 3000 });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur modification:', error);
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Echec de la modification', life: 5000 });
        }
      })
    );
  }

  closeEditEpiModal(): void {
    this.showEditEpiModal = false;
    this.editingEpi = null;
    this.editEpiName = '';
    this.editEpiCode = '';
    this.editEpiMetrage = null;
  }

  deleteEpi(epie: Emplacement, event?: MouseEvent): void {
    if (event) event.stopPropagation();

    if (confirm(`Voulez-vous vraiment supprimer ${epie.numero} ?`)) {
      if (epie.id?.startsWith('local-')) {
        this.epies = this.epies.filter(s => s.id !== epie.id);
        this._localEpieData.delete(epie.id!);
        if (this.selectedEpie?.id === epie.id) {
          this.view = 'list';
          this.selectedEpie = null;
        }
        this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Emplacement supprime', life: 3000 });
        return;
      }

      if (!epie.id) return;
      this.subscriptions.push(
        this.emplacementService.delete(epie.id).subscribe({
          next: () => {
            this.loadEpies();
            if (this.selectedEpie?.id === epie.id) {
              this.view = 'list';
              this.selectedEpie = null;
            }
            this.messageService.add({ severity: 'success', summary: 'Suppression réussie', detail: 'Emplacement supprimé.', life: 3000 });
          },
          error: (error: HttpErrorResponse) => {
            console.error('Erreur suppression:', error);
            const detail =
              (error?.error && typeof error.error === 'object' && (error.error as any).message) ||
              (typeof error?.error === 'string' ? error.error : null) ||
              error?.message ||
              'Échec de la suppression.';
            this.messageService.add({ severity: 'error', summary: 'Suppression impossible', detail, life: 6000 });
          }
        })
      );
    }
  }

  // Gestion de la matrice

  selectRow(index: number): void {
    this.selectedRowIndex = index;
  }

  private isLocalEpie(): boolean {
    return !!this.selectedEpie?.id?.startsWith('local-');
  }

  // Vue détail tablette (blocs)

  openTabletteDetail(cell: Cell): void {
    if (cell.deleted) return;
    if (this._dragJustFinished) { this._dragJustFinished = false; return; }
    this.selectedTabletteCell = cell;
    this.showTabletteDetail = true;
  }

  closeTabletteDetail(): void {
    this.showTabletteDetail = false;
    this.selectedTabletteCell = null;
    this.showBlocModal = false;
  }

  // ----- Modal ajout/edition de BLOC -----

  openAddBlocModal(): void {
    this.newBlocTitle = '';
    this.newBlocColor = '#3b82f6';
    this.newBlocMetrage = null;
    this.isBlocEditMode = false;
    this.editingBlocInDetail = null;
    this.showBlocModal = true;
  }

  openEditBlocModal(bloc: Block, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (this._dragJustFinished) { this._dragJustFinished = false; return; }
    this.newBlocTitle = bloc.title;
    this.newBlocColor = bloc.color;
    this.newBlocMetrage = bloc.metrage ?? null;
    this.isBlocEditMode = true;
    this.editingBlocInDetail = bloc;
    this.showBlocModal = true;
  }

  closeBlocModal(): void {
    this.showBlocModal = false;
    this.editingBlocInDetail = null;
  }

  saveBlocToTablette(): void {
    if (!this.newBlocTitle || !this.selectedTabletteCell) return;

    if (this.isBlocEditMode && this.editingBlocInDetail) {
      const blocId = this.editingBlocInDetail._emplacementId;
      if (blocId) {
        const updated: Emplacement = {
          id: blocId,
          numero: this.newBlocTitle,
          type: TypeEmp.BLOC,
          metrage: this.newBlocMetrage ?? 0
        };
        this.subscriptions.push(
          this.emplacementService.update(blocId, updated).subscribe({
            next: () => {
              this.editingBlocInDetail!.title = this.newBlocTitle;
              this.editingBlocInDetail!.color = this.newBlocColor;
              this.editingBlocInDetail!.metrage = this.newBlocMetrage ?? undefined;
              this.closeBlocModal();
              this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Bloc modifie', life: 3000 });
            },
            error: (err: HttpErrorResponse) => {
              console.error('Erreur modification bloc:', err);
              const detail = err?.error?.message || err?.message || 'Echec modification du bloc';
              this.messageService.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 });
            }
          })
        );
      } else {
        this.editingBlocInDetail.title = this.newBlocTitle;
        this.editingBlocInDetail.color = this.newBlocColor;
        this.editingBlocInDetail.metrage = this.newBlocMetrage ?? undefined;
        this.closeBlocModal();
      }
      return;
    }

    // Add new bloc — optimistic: add locally first, revert on API error
    const tabletteId = this.selectedTabletteCell._tabletteId;
    const newBloc: Block = {
      title: this.newBlocTitle,
      color: this.newBlocColor,
      metrage: this.newBlocMetrage ?? undefined,
      _tabletteId: tabletteId
    };

    if (!this.selectedTabletteCell.blocs) this.selectedTabletteCell.blocs = [];
    this.selectedTabletteCell.blocs.push(newBloc);
    this.closeBlocModal();

    if (tabletteId && !tabletteId.startsWith('local-')) {
      const empl: Emplacement = {
        numero: this.newBlocTitle,
        type: TypeEmp.BLOC,
        metrage: this.newBlocMetrage ?? 0
      };
      this.subscriptions.push(
        this.emplacementService.createChild(tabletteId, empl).subscribe({
          next: (created: Emplacement) => {
            newBloc._emplacementId = created.id;
            this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Bloc ajoute', life: 3000 });
          },
          error: (err: HttpErrorResponse) => {
            // Revert optimistic addition
            this.selectedTabletteCell!.blocs = this.selectedTabletteCell!.blocs!.filter(b => b !== newBloc);
            const detail = err?.error?.message || err?.message || 'Echec creation du bloc';
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 });
          }
        })
      );
    } else {
      this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Bloc ajoute', life: 3000 });
    }
  }

  deleteBlocFromTablette(bloc: Block, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!this.selectedTabletteCell) return;

    if (confirm(`Supprimer le bloc "${bloc.title}" ?`)) {
      if (bloc._emplacementId) {
        this.subscriptions.push(
          this.emplacementService.delete(bloc._emplacementId).subscribe({
            next: () => {
              this.selectedTabletteCell!.blocs = this.selectedTabletteCell!.blocs!.filter(b => b !== bloc);
              this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Bloc supprime', life: 3000 });
            },
            error: () => {
              this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Echec suppression du bloc', life: 5000 });
            }
          })
        );
      } else {
        this.selectedTabletteCell.blocs = this.selectedTabletteCell.blocs!.filter(b => b !== bloc);
      }
    }
  }

  // ==========================================================================
  // GESTION DES TABLETTES (EDIT / DELETE / RE-ADD)
  // ==========================================================================

  openEditTabletteModal(cell: Cell, r: number, c: number, event: MouseEvent): void {
    event.stopPropagation();
    this.editingTabletteCell = cell;
    this.editTabletteNumero = cell.tabletteNumero || '';
    this.editTabletteMetrage = cell.tabletteMetrage ?? 0;
    this.editTabletteRowIndex = r;
    this.editTabletteColIndex = c;
    this.showEditTabletteModal = true;
  }

  closeEditTabletteModal(): void {
    this.showEditTabletteModal = false;
    this.editingTabletteCell = null;
    this.editTabletteNumero = '';
    this.editTabletteMetrage = 0;
    this.editTabletteRowIndex = null;
    this.editTabletteColIndex = null;
  }

  saveTabletteEdit(): void {
    if (!this.editingTabletteCell || !this.editTabletteNumero) return;

    const tabletteId = this.editingTabletteCell._tabletteId;
    if (tabletteId && !tabletteId.startsWith('local-')) {
      const updated: Emplacement = {
        id: tabletteId,
        numero: this.editTabletteNumero,
        type: TypeEmp.TABLETTE,
        metrage: this.editTabletteMetrage
      };
      this.subscriptions.push(
        this.emplacementService.update(tabletteId, updated).subscribe({
          next: () => {
            this.editingTabletteCell!.tabletteNumero = this.editTabletteNumero;
            this.editingTabletteCell!.tabletteMetrage = this.editTabletteMetrage;
            this.closeEditTabletteModal();
            this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Tablette modifiee', life: 3000 });
          },
          error: (err: HttpErrorResponse) => {
            console.error('Erreur modification tablette:', err);
            const detail = err?.error?.message || err?.message || 'Echec modification de la tablette';
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 });
          }
        })
      );
    } else {
      this.editingTabletteCell.tabletteNumero = this.editTabletteNumero;
      this.editingTabletteCell.tabletteMetrage = this.editTabletteMetrage;
      this.closeEditTabletteModal();
      this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Tablette modifiee', life: 3000 });
    }
  }

  // ─── TRAVERS EDIT / DELETE ────────────────────────────────────────────

  openEditTraversModal(travers: Emplacement, i: number, event: MouseEvent): void {
    event.stopPropagation();
    this.editingTraversIndex = i;
    this.editTraversNumero = travers.numero || '';
    this.editTraversMetrage = travers.metrage ?? 0;
    this.showEditTraversModal = true;
  }

  closeEditTraversModal(): void {
    this.showEditTraversModal = false;
    this.editingTraversIndex = null;
    this.editTraversNumero = '';
    this.editTraversMetrage = 0;
  }

  saveTraversEdit(): void {
    if (!this.editTraversNumero || this.editingTraversIndex === null) return;
    const travers = this.traversChildren[this.editingTraversIndex];
    const idx = this.editingTraversIndex;

    if (travers.id && !travers.id.startsWith('local-')) {
      const updated: Emplacement = {
        id: travers.id,
        numero: this.editTraversNumero,
        type: TypeEmp.TRAVERS,
        metrage: this.editTraversMetrage
      };
      this.subscriptions.push(
        this.emplacementService.update(travers.id, updated).subscribe({
          next: () => {
            this.traversChildren[idx].numero = this.editTraversNumero;
            this.traversChildren[idx].metrage = this.editTraversMetrage;
            this.closeEditTraversModal();
            this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Travers modifie', life: 3000 });
          },
          error: (err: HttpErrorResponse) => {
            const detail = err?.error?.message || err?.message || 'Echec modification du travers';
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 });
          }
        })
      );
    } else {
      this.traversChildren[idx].numero = this.editTraversNumero;
      this.traversChildren[idx].metrage = this.editTraversMetrage;
      this.closeEditTraversModal();
      this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Travers modifie', life: 3000 });
    }
  }

  deleteTravers(travers: Emplacement, i: number, event: MouseEvent): void {
    event.stopPropagation();
    // Check the live matrix column — tabletteMap can be stale after tablette deletions
    const hasActiveTablettes = this.matrix.some(row => {
      const cell = row[i];
      return cell && !cell.deleted && cell._tabletteId && !cell._tabletteId.startsWith('local-');
    });
    if (hasActiveTablettes) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Impossible',
        detail: `Le travers "${travers.numero}" contient des tablettes. Supprimez-les d'abord.`,
        life: 5000
      });
      return;
    }
    if (!confirm(`Supprimer le travers "${travers.numero}" ?`)) return;

    if (travers.id && !travers.id.startsWith('local-')) {
      this.subscriptions.push(
        this.emplacementService.delete(travers.id).subscribe({
          next: () => {
            this.traversChildren.splice(i, 1);
            this.matrix.forEach(row => row.splice(i, 1));
            this.cols--;
            this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Travers supprime', life: 3000 });
          },
          error: (err: HttpErrorResponse) => {
            const detail = err?.error?.message || err?.message || 'Echec suppression du travers';
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 });
          }
        })
      );
    } else {
      this.traversChildren.splice(i, 1);
      this.matrix.forEach(row => row.splice(i, 1));
      this.cols--;
      this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Travers supprime', life: 3000 });
    }
  }

  deleteTablette(cell: Cell, r: number, c: number, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm(`Supprimer la tablette "${cell.tabletteNumero || 'TAB' + (r + 1)}" ?`)) {
      const tabletteId = cell._tabletteId;
      if (tabletteId && !tabletteId.startsWith('local-')) {
        this.subscriptions.push(
          this.emplacementService.delete(tabletteId).subscribe({
            next: () => {
              cell.deleted = true;
              cell._deletedTabletteNumero = cell.tabletteNumero;
              cell.blocs = [];
              // Keep tabletteMap in sync so deleteTravers sees accurate state
              const traversId = cell._traversId || this.traversChildren[c]?.id;
              if (traversId) {
                const list = this.tabletteMap.get(traversId) || [];
                const filtered = list.filter(t => t.id !== tabletteId);
                this.tabletteMap.set(traversId, filtered);
              }
              this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Tablette supprimee', life: 3000 });
            },
            error: (err) => {
              console.error('Erreur suppression tablette:', err);
              this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Echec suppression de la tablette', life: 5000 });
            }
          })
        );
      } else {
        cell.deleted = true;
        cell._deletedTabletteNumero = cell.tabletteNumero;
        cell.blocs = [];
        this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Tablette supprimee', life: 3000 });
      }
    }
  }

  addTabletteBack(r: number, c: number): void {
    const cell = this.matrix[r]?.[c];
    if (!cell) return;

    // Look up the parent TRAVERS using both cell._traversId and the traversChildren array as fallback
    const traversId = cell._traversId || this.traversChildren[c]?.id;
    if (!traversId) {
      this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Travers parent introuvable', life: 5000 });
      return;
    }

    const numero = cell._deletedTabletteNumero || `TAB-${String(r + 1).padStart(2, '0')}`;
    const newTablette: Emplacement = { numero, type: TypeEmp.TABLETTE, metrage: 0 };

    if (this.isLocalEpie() || traversId.startsWith('local-')) {
      cell.deleted = false;
      cell.tabletteNumero = numero;
      cell._tabletteId = `local-tab-${r}-${c}`;
      cell._traversId = traversId;
      cell.blocs = [];
      this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Tablette ajoutee', life: 3000 });
      return;
    }

    this.subscriptions.push(
      this.emplacementService.createChild(traversId, newTablette).subscribe({
        next: (created: Emplacement) => {
          cell.deleted = false;
          cell._tabletteId = created.id;
          cell._traversId = traversId;
          cell.tabletteNumero = created.numero || numero;
          cell.blocs = [];
          this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Tablette ajoutee', life: 3000 });
        },
        error: (err) => {
          console.error('Erreur ajout tablette:', err);
          const detail = err?.error?.message || err?.message || 'Echec ajout de la tablette';
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 });
        }
      })
    );
  }

  // ==========================================================================
  // SOFT-DELETE / RE-ADD BLOC (dans vue detail tablette)
  // ==========================================================================

  softDeleteBloc(bloc: Block, event?: MouseEvent): void {
    if (event) event.stopPropagation();
    if (!this.selectedTabletteCell) return;

    if (bloc._emplacementId) {
      this.subscriptions.push(
        this.emplacementService.delete(bloc._emplacementId).subscribe({
          next: () => {
            bloc.deleted = true;
            this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Bloc supprime', life: 3000 });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Echec suppression du bloc', life: 5000 });
          }
        })
      );
    } else {
      bloc.deleted = true;
    }
  }

  addBlocBack(bloc: Block): void {
    if (!this.selectedTabletteCell) return;

    const tabletteId = this.selectedTabletteCell._tabletteId;
    const numero = bloc.title || 'BLOC';
    const newEmpl: Emplacement = { numero, type: TypeEmp.BLOC, metrage: 0 };

    if (tabletteId && !tabletteId.startsWith('local-')) {
      this.subscriptions.push(
        this.emplacementService.createChild(tabletteId, newEmpl).subscribe({
          next: (created: Emplacement) => {
            bloc.deleted = false;
            bloc._emplacementId = created.id;
            this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Bloc restaure', life: 3000 });
          },
          error: () => {
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Echec restauration du bloc', life: 5000 });
          }
        })
      );
    } else {
      bloc.deleted = false;
    }
  }

  // Redimensionnement

  openResizeModal(): void {
    if (!this.selectedEpie) return;
    this.tempRows = this.rows;
    this.tempCols = this.cols;
    this.showResizeModal = true;
  }

  applyResize(): void {
    if (!this.selectedEpie) return;

    if (this.tempRows < 1 || this.tempCols < 1) {
      this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Les dimensions doivent etre superieures a 0', life: 3000 });
      return;
    }
    if (this.tempRows > 50 || this.tempCols > 50) {
      this.messageService.add({ severity: 'warn', summary: 'Attention', detail: 'Les dimensions ne peuvent pas depasser 50', life: 3000 });
      return;
    }

    if (this.isLocalEpie()) {
      const newMatrix: Cell[][] = [];
      for (let r = 0; r < this.tempRows; r++) {
        const row: Cell[] = [];
        for (let c = 0; c < this.tempCols; c++) {
          if (r < this.rows && c < this.cols && this.matrix[r]?.[c]) {
            row.push(this.matrix[r][c]);
          } else {
            row.push({ blocs: [], tabletteNumero: `TAB${r + 1}`, _traversId: `local-travers-${c}` });
          }
        }
        newMatrix.push(row);
      }
      if (this.tempCols > this.cols) {
        for (let i = this.cols; i < this.tempCols; i++) {
          this.traversChildren.push({ id: `local-travers-${i}`, numero: `TRAV-${String(i + 1).padStart(2, '0')}`, type: TypeEmp.TRAVERS });
        }
      } else if (this.tempCols < this.cols) {
        this.traversChildren = this.traversChildren.slice(0, this.tempCols);
      }
      this.matrix = newMatrix;
      this.rows = this.tempRows;
      this.cols = this.tempCols;
      this.showResizeModal = false;
      return;
    }

    const rowDiff = this.tempRows - this.rows;
    const colDiff = this.tempCols - this.cols;
    const operations: Observable<any>[] = [];

    if (colDiff > 0) {
      for (let i = 0; i < colDiff; i++) {
        const travers: Emplacement = { numero: `TRAV-${String(this.cols + i + 1).padStart(2, '0')}`, type: TypeEmp.TRAVERS, metrage: 0 };
        operations.push(this.emplacementService.createChild(this.selectedEpie.id!, travers));
      }
    }

    if (operations.length > 0) {
      forkJoin(operations).subscribe({
        next: () => this.handleRowResize(rowDiff),
        error: () => { this.showResizeModal = false; this.openEpie(this.selectedEpie!); }
      });
    } else if (colDiff < 0) {
      const deleteOps: Observable<any>[] = [];
      for (let i = 0; i < Math.abs(colDiff); i++) {
        const traversToDelete = this.traversChildren[this.cols - 1 - i];
        if (traversToDelete?.id) deleteOps.push(this.emplacementService.delete(traversToDelete.id));
      }
      if (deleteOps.length > 0) {
        forkJoin(deleteOps).subscribe({
          next: () => this.handleRowResize(rowDiff),
          error: () => { this.showResizeModal = false; this.openEpie(this.selectedEpie!); }
        });
      } else {
        this.handleRowResize(rowDiff);
      }
    } else {
      this.handleRowResize(rowDiff);
    }
  }

  private handleRowResize(rowDiff: number): void {
    if (rowDiff === 0) {
      this.showResizeModal = false;
      this.openEpie(this.selectedEpie!);
      return;
    }

    this.emplacementService.getChildren(this.selectedEpie!.id!).subscribe({
      next: (travers) => {
        if (rowDiff > 0) {
          const tabletteOps: Observable<any>[] = [];
          travers.forEach(trav => {
            for (let i = 0; i < rowDiff; i++) {
              tabletteOps.push(this.emplacementService.createChild(trav.id!, {
                numero: `TAB-${String(this.rows + i + 1).padStart(2, '0')}`,
                type: TypeEmp.TABLETTE,
                metrage: 0
              }));
            }
          });
          forkJoin(tabletteOps).subscribe({
            next: () => { this.showResizeModal = false; this.openEpie(this.selectedEpie!); },
            error: () => { this.showResizeModal = false; this.openEpie(this.selectedEpie!); }
          });
        } else {
          const deleteOps: Observable<any>[] = [];
          travers.forEach(trav => {
            const tabletteList = this.tabletteMap.get(trav.id!) || [];
            for (let i = 0; i < Math.abs(rowDiff); i++) {
              const tab = tabletteList[tabletteList.length - 1 - i];
              if (tab?.id) deleteOps.push(this.emplacementService.delete(tab.id));
            }
          });
          if (deleteOps.length > 0) {
            forkJoin(deleteOps).subscribe({
              next: () => { this.showResizeModal = false; this.openEpie(this.selectedEpie!); },
              error: () => { this.showResizeModal = false; this.openEpie(this.selectedEpie!); }
            });
          } else {
            this.showResizeModal = false;
            this.openEpie(this.selectedEpie!);
          }
        }
      },
      error: () => { this.showResizeModal = false; this.openEpie(this.selectedEpie!); }
    });
  }

  closeResizeModal(): void {
    this.showResizeModal = false;
  }

  addRow(): void {
    if (!this.selectedEpie || (this.cols === 0 && this.traversChildren.length === 0)) return;

    if (this.isLocalEpie()) {
      const newRow: Cell[] = [];
      for (let c = 0; c < this.cols; c++) {
        newRow.push({ blocs: [], tabletteNumero: `TAB${this.rows + 1}`, _traversId: `local-travers-${c}` });
      }
      this.matrix.push(newRow);
      this.rows++;
      return;
    }

    if (this.traversChildren.length === 0) return;

    const tabletteRequests = this.traversChildren.map(trav =>
      this.emplacementService.createChild(trav.id!, {
        numero: `TAB-${String(this.rows + 1).padStart(2, '0')}`,
        type: TypeEmp.TABLETTE,
        metrage: 0
      })
    );

    forkJoin(tabletteRequests).subscribe({
      next: (createdTablettes) => {
        const newRow: Cell[] = createdTablettes.map((tab, colIdx) => ({
          blocs: [],
          _tabletteId: tab.id,
          _traversId: this.traversChildren[colIdx].id,
          tabletteNumero: tab.numero
        }));
        this.matrix.push(newRow);
        this.rows++;
      },
      error: (err) => {
        console.error('Erreur ajout tablette:', err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Echec ajout de la tablette', life: 5000 });
      }
    });
  }

  addColumn(): void {
    if (!this.selectedEpie) return;

    if (this.isLocalEpie()) {
      const newTraversId = `local-travers-${this.cols}`;
      this.traversChildren.push({ id: newTraversId, numero: `TRAV-${String(this.cols + 1).padStart(2, '0')}`, type: TypeEmp.TRAVERS });
      this.matrix.forEach((row, r) => row.push({ blocs: [], tabletteNumero: `TAB${r + 1}`, _traversId: newTraversId }));
      this.cols++;
      return;
    }

    const newTravers: Emplacement = { numero: `TRAV-${String(this.cols + 1).padStart(2, '0')}`, type: TypeEmp.TRAVERS, metrage: 0 };

    this.emplacementService.createChild(this.selectedEpie.id!, newTravers).subscribe({
      next: (createdTravers) => {
        this.traversChildren.push(createdTravers);

        const tabletteRequests: Observable<Emplacement>[] = [];
        for (let r = 0; r < this.rows; r++) {
          tabletteRequests.push(this.emplacementService.createChild(createdTravers.id!, {
            numero: `TAB-${String(r + 1).padStart(2, '0')}`,
            type: TypeEmp.TABLETTE,
            metrage: 0
          }));
        }

        if (tabletteRequests.length === 0) {
          this.matrix.forEach(row => row.push({ blocs: [], _traversId: createdTravers.id }));
          this.cols++;
          return;
        }

        forkJoin(tabletteRequests).subscribe({
          next: (createdTablettes) => {
            this.matrix.forEach((row, r) => {
              row.push({ blocs: [], _tabletteId: createdTablettes[r]?.id, _traversId: createdTravers.id, tabletteNumero: createdTablettes[r]?.numero });
            });
            this.cols++;
          },
          error: (err) => console.error('Erreur creation tablettes:', err)
        });
      },
      error: (err) => {
        console.error('Erreur creation travers:', err);
        this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Echec ajout de la colonne', life: 5000 });
      }
    });
  }

  removeLastRow(): void {
    if (!this.selectedEpie || this.rows <= 1) return;

    if (confirm('Supprimer la derniere tablette ?')) {
      if (this.isLocalEpie()) {
        this.matrix.pop();
        this.rows--;
        return;
      }
      const deleteOps: Observable<any>[] = [];
      const lastRowIdx = this.rows - 1;
      this.traversChildren.forEach(trav => {
        const tabletteList = this.tabletteMap.get(trav.id!) || [];
        const lastTablette = tabletteList[lastRowIdx];
        if (lastTablette?.id) deleteOps.push(this.emplacementService.delete(lastTablette.id));
      });
      if (deleteOps.length > 0) {
        forkJoin(deleteOps).subscribe({
          next: () => {
            this.matrix.pop();
            this.rows--;
            this.traversChildren.forEach(trav => { const list = this.tabletteMap.get(trav.id!) || []; list.pop(); });
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Echec suppression', life: 5000 })
        });
      } else {
        this.matrix.pop();
        this.rows--;
      }
    }
  }

  removeLastColumn(): void {
    if (!this.selectedEpie || this.cols <= 1) return;

    if (confirm('Supprimer le dernier travers ?')) {
      if (this.isLocalEpie()) {
        this.traversChildren.pop();
        this.matrix = this.matrix.map(row => row.slice(0, -1));
        this.cols--;
        return;
      }
      const lastTravers = this.traversChildren[this.cols - 1];
      if (!lastTravers?.id) return;
      this.emplacementService.delete(lastTravers.id).subscribe({
        next: () => {
          this.traversChildren.pop();
          this.matrix = this.matrix.map(row => row.slice(0, -1));
          this.cols--;
          this.tabletteMap.delete(lastTravers.id!);
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Erreur', detail: 'Echec suppression colonne', life: 5000 })
      });
    }
  }

  // Glisser-déposer des tablettes

  onTabletteDragStart(r: number, c: number, event: DragEvent): void {
    this.draggingCell = { r, c };
    this._dragJustFinished = false;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', `${r},${c}`);
    }
  }

  onTabletteDragOver(r: number, c: number, event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    const cell = this.matrix[r]?.[c];
    if (cell && !cell.deleted && !(this.draggingCell?.r === r && this.draggingCell?.c === c)) {
      cell.isDragOver = true;
    }
  }

  onTabletteDragLeave(r: number, c: number, event: DragEvent): void {
    const cell = this.matrix[r]?.[c];
    if (cell) cell.isDragOver = false;
  }

  onTabletteDragEnd(event: DragEvent): void {
    // Clear all drag-over states
    this.matrix.forEach(row => row.forEach(cell => { cell.isDragOver = false; }));
    this._dragJustFinished = true;
    // Reset after a tick so the click handler that fires right after can read it
    setTimeout(() => { this._dragJustFinished = false; }, 200);
    this.draggingCell = null;
  }

  onTabletteDrop(r: number, c: number, event: DragEvent): void {
    event.preventDefault();
    const cell = this.matrix[r]?.[c];
    if (cell) cell.isDragOver = false;

    if (!this.draggingCell) return;

    const srcR = this.draggingCell.r;
    const srcC = this.draggingCell.c;
    this.draggingCell = null;

    if (srcR === r && srcC === c) return;

    const srcCell = this.matrix[srcR]?.[srcC];
    const dstCell = this.matrix[r]?.[c];

    if (!srcCell || !dstCell || srcCell.deleted || dstCell.deleted) return;

    // Swap visually
    this.matrix[srcR][srcC] = dstCell;
    this.matrix[r][c] = srcCell;

    // Update _traversId references after swap
    const srcOrigTraversId = srcCell._traversId;
    const dstOrigTraversId = dstCell._traversId;
    srcCell._traversId = dstOrigTraversId;
    dstCell._traversId = srcOrigTraversId;

    // If different columns: update parent IDs in DB
    if (srcC !== c) {
      const ops: any[] = [];

      if (srcCell._tabletteId && dstOrigTraversId && !srcCell._tabletteId.startsWith('local-') && !dstOrigTraversId.startsWith('local-')) {
        ops.push(this.emplacementService.updateParent(
          srcCell._tabletteId,
          srcCell.tabletteNumero || `TAB-${srcR + 1}`,
          TypeEmp.TABLETTE,
          dstOrigTraversId
        ));
      }
      if (dstCell._tabletteId && srcOrigTraversId && !dstCell._tabletteId.startsWith('local-') && !srcOrigTraversId.startsWith('local-')) {
        ops.push(this.emplacementService.updateParent(
          dstCell._tabletteId,
          dstCell.tabletteNumero || `TAB-${r + 1}`,
          TypeEmp.TABLETTE,
          srcOrigTraversId
        ));
      }

      if (ops.length > 0) {
        forkJoin(ops).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Tablettes echangees et base de donnees mise a jour', life: 3000 });
          },
          error: () => {
            // Revert visual swap
            this.matrix[srcR][srcC] = srcCell;
            this.matrix[r][c] = dstCell;
            srcCell._traversId = srcOrigTraversId;
            dstCell._traversId = dstOrigTraversId;
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: "Echec de l'echange - modifications annulees", life: 5000 });
          }
        });
      } else {
        this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Tablettes echangees', life: 3000 });
      }
    } else {
      // Same column reorder (no parent change needed)
      this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Tablettes echangees', life: 3000 });
    }
  }

  // Glisser-déposer des blocs

  onBlocDragStart(index: number, event: DragEvent): void {
    this.draggingBlocIndex = index;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onBlocDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    if (this.draggingBlocIndex !== index) {
      this.draggingBlocTargetIndex = index;
    }
  }

  onBlocDragLeave(index: number, event: DragEvent): void {
    if (this.draggingBlocTargetIndex === index) {
      this.draggingBlocTargetIndex = null;
    }
  }

  onBlocDragEnd(event: DragEvent): void {
    this._dragJustFinished = true;
    setTimeout(() => { this._dragJustFinished = false; }, 200);
    this.draggingBlocIndex = null;
    this.draggingBlocTargetIndex = null;
  }

  onBlocDrop(index: number, event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.draggingBlocTargetIndex = null;

    if (this.draggingBlocIndex === null || !this.selectedTabletteCell?.blocs) {
      this.draggingBlocIndex = null;
      return;
    }

    const srcIndex = this.draggingBlocIndex;
    this.draggingBlocIndex = null;

    if (srcIndex === index) return;

    const blocs = this.selectedTabletteCell.blocs;
    const srcBloc = blocs[srcIndex];
    const dstBloc = blocs[index];

    if (!srcBloc || !dstBloc || srcBloc.deleted || dstBloc.deleted) return;

    // Swap in array
    blocs[srcIndex] = dstBloc;
    blocs[index] = srcBloc;

    // Blocs in the same tablette detail: same parent, no parentId change needed.
    // If the two blocs happen to have different _tabletteId (edge case), update DB.
    if (srcBloc._tabletteId && dstBloc._tabletteId && srcBloc._tabletteId !== dstBloc._tabletteId) {
      const srcId = srcBloc._emplacementId;
      const dstId = dstBloc._emplacementId;
      const srcNewParent = dstBloc._tabletteId!;
      const dstNewParent = srcBloc._tabletteId!;

      const ops: any[] = [];
      if (srcId && !srcId.startsWith('local-')) ops.push(
        this.emplacementService.updateParent(srcId, srcBloc.title, TypeEmp.BLOC, srcNewParent)
      );
      if (dstId && !dstId.startsWith('local-')) ops.push(
        this.emplacementService.updateParent(dstId, dstBloc.title, TypeEmp.BLOC, dstNewParent)
      );

      // Update _tabletteId references
      srcBloc._tabletteId = srcNewParent;
      dstBloc._tabletteId = dstNewParent;

      if (ops.length > 0) {
        forkJoin(ops).subscribe({
          next: () => this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Blocs echanges', life: 3000 }),
          error: () => {
            // Revert
            blocs[srcIndex] = srcBloc;
            blocs[index] = dstBloc;
            this.messageService.add({ severity: 'error', summary: 'Erreur', detail: "Echec de l'echange des blocs", life: 5000 });
          }
        });
      }
    } else {
      this.messageService.add({ severity: 'success', summary: 'Succes', detail: 'Blocs echanges', life: 3000 });
    }
  }

  // Sélection multiple et suppression groupée

  get hasSelection(): boolean {
    return this.selectedTraversIds.size > 0 || this.selectedTabletteKeys.size > 0 || this.selectedBlocIds.size > 0;
  }

  get selectionCount(): number {
    return this.selectedTraversIds.size + this.selectedTabletteKeys.size + this.selectedBlocIds.size;
  }

  toggleTraversSelection(colIndex: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.selectedTraversIds.has(colIndex)) {
      this.selectedTraversIds.delete(colIndex);
    } else {
      this.selectedTraversIds.add(colIndex);
    }
  }

  toggleTabletteSelection(r: number, c: number, event: MouseEvent): void {
    event.stopPropagation();
    const key = `${r}-${c}`;
    if (this.selectedTabletteKeys.has(key)) {
      this.selectedTabletteKeys.delete(key);
    } else {
      this.selectedTabletteKeys.add(key);
    }
  }

  toggleBlocSelection(bloc: Block, index: number, event: MouseEvent): void {
    event.stopPropagation();
    const key = bloc._emplacementId || `local-bloc-${index}`;
    if (this.selectedBlocIds.has(key)) {
      this.selectedBlocIds.delete(key);
    } else {
      this.selectedBlocIds.add(key);
    }
  }

  isBlocSelected(bloc: Block, index: number): boolean {
    const key = bloc._emplacementId || `local-bloc-${index}`;
    return this.selectedBlocIds.has(key);
  }

  clearSelection(): void {
    this.selectedTraversIds.clear();
    this.selectedTabletteKeys.clear();
    this.selectedBlocIds.clear();
  }

  bulkDelete(): void {
    // --- Validate travers: must have no active tablettes ---
    for (const colIndex of this.selectedTraversIds) {
      const travers = this.traversChildren[colIndex];
      const hasActive = this.matrix.some(row => {
        const cell = row[colIndex];
        return cell && !cell.deleted && cell._tabletteId && !cell._tabletteId.startsWith('local-');
      });
      if (hasActive) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Suppression impossible',
          detail: `Le travers "${travers?.numero || colIndex + 1}" contient des tablettes actives. Supprimez-les d'abord.`,
          life: 5000
        });
        return;
      }
    }

    if (!confirm(`Supprimer les ${this.selectionCount} élément(s) sélectionné(s) ?`)) return;

    const deleteObs: Observable<any>[] = [];
    const localOps: (() => void)[] = [];

    //  Collect bloc deletions 
    if (this.selectedBlocIds.size > 0 && this.selectedTabletteCell?.blocs) {
      for (let i = 0; i < this.selectedTabletteCell.blocs.length; i++) {
        const bloc = this.selectedTabletteCell.blocs[i];
        const key = bloc._emplacementId || `local-bloc-${i}`;
        if (this.selectedBlocIds.has(key) && !bloc.deleted) {
          if (bloc._emplacementId && !bloc._emplacementId.startsWith('local-')) {
            deleteObs.push(this.emplacementService.delete(bloc._emplacementId));
            localOps.push(() => { bloc.deleted = true; });
          } else {
            localOps.push(() => { bloc.deleted = true; });
          }
        }
      }
    }

    // --- Collect tablette deletions ---
    for (const key of this.selectedTabletteKeys) {
      const [rStr, cStr] = key.split('-');
      const r = parseInt(rStr, 10);
      const c = parseInt(cStr, 10);
      const cell = this.matrix[r]?.[c];
      if (!cell || cell.deleted) continue;
      const tabletteId = cell._tabletteId;
      if (tabletteId && !tabletteId.startsWith('local-')) {
        deleteObs.push(this.emplacementService.delete(tabletteId));
        localOps.push(() => {
          cell.deleted = true;
          cell._deletedTabletteNumero = cell.tabletteNumero;
          cell.blocs = [];
          const traversId = cell._traversId || this.traversChildren[c]?.id;
          if (traversId) {
            const list = this.tabletteMap.get(traversId) || [];
            this.tabletteMap.set(traversId, list.filter(t => t.id !== tabletteId));
          }
        });
      } else {
        localOps.push(() => {
          cell.deleted = true;
          cell._deletedTabletteNumero = cell.tabletteNumero;
          cell.blocs = [];
        });
      }
    }

    // --- Collect travers deletions (processed after tablettes) ---
    const sortedTraversCols = Array.from(this.selectedTraversIds).sort((a, b) => b - a);
    for (const colIndex of sortedTraversCols) {
      const travers = this.traversChildren[colIndex];
      if (travers?.id && !travers.id.startsWith('local-')) {
        deleteObs.push(this.emplacementService.delete(travers.id));
        localOps.push(() => {
          this.traversChildren.splice(colIndex, 1);
          this.matrix.forEach(row => row.splice(colIndex, 1));
          this.cols--;
        });
      } else {
        localOps.push(() => {
          this.traversChildren.splice(colIndex, 1);
          this.matrix.forEach(row => row.splice(colIndex, 1));
          this.cols--;
        });
      }
    }

    if (deleteObs.length > 0) {
      forkJoin(deleteObs).subscribe({
        next: () => {
          localOps.forEach(op => op());
          this.clearSelection();
          this.messageService.add({ severity: 'success', summary: 'Succès', detail: `${deleteObs.length + localOps.length - deleteObs.length} élément(s) supprimé(s)`, life: 3000 });
        },
        error: (err: HttpErrorResponse) => {
          const detail = err?.error?.message || err?.message || 'Erreur lors de la suppression groupée';
          this.messageService.add({ severity: 'error', summary: 'Erreur', detail, life: 5000 });
        }
      });
    } else {
      localOps.forEach(op => op());
      this.clearSelection();
      this.messageService.add({ severity: 'success', summary: 'Succès', detail: 'Élément(s) supprimé(s)', life: 3000 });
    }
  }
}
