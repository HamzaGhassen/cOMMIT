import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { FormGroup, Validators, FormControl, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { Table } from 'primeng/table';
import { MessageService, LazyLoadEvent } from 'primeng/api';
import { Subscription } from 'rxjs';
import { Gender } from 'src/app/enums/Gender';
import { Role } from 'src/app/enums/Role';
import { AgentService } from 'src/app/services/agent.service';
import { AuthenticationService } from 'src/app/services/authenticationService';
import { HarborService } from 'src/app/services/harbor.service';
import { JobService } from 'src/app/services/job.service';
import { PositionService } from 'src/app/services/position.service';
import { Harbor } from 'src/shared/Harbor';
import { Job } from 'src/shared/Job';
import { Pageable } from 'src/shared/Pageable';
import { Position } from 'src/shared/Position';
import { Agent } from 'src/shared/Agent';
import { User } from 'src/shared/User';

// ===== VALIDATEURS PERSONNALISÉS =====

/**
 * Validateur de correspondance des mots de passe
 */
export const passwordMatchingValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { notmatched: true };
};

// Liste des agents pour les validations d'unicité
let AGENTS_LIST: Agent[] = [];

/**
 * Validateur d'unicité du nom d'utilisateur
 */
export const usernameExistsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (control.get('username')?.dirty) {
    const username = control.get('username')?.value;
    const exists = AGENTS_LIST.some(agent => agent.username === username);
    return exists ? { usernameTaken: true } : null;
  }
  return null;
};

/**
 * Validateur d'unicité du matricule
 */
export const regNumberExistsValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (control.get('registrationNumber')?.dirty) {
    const registrationNumber = control.get('registrationNumber')?.value;
    const exists = AGENTS_LIST.some(agent => agent.user?.registrationNumber === registrationNumber);
    return exists ? { regNumberTaken: true } : null;
  }
  return null;
};

@Component({
  selector: 'app-agent',
  templateUrl: './agent.component.html',
  styleUrls: ['./agent.component.scss'],
  providers: [MessageService]
})
export class AgentComponent implements OnInit, OnDestroy {
  // ===== PROPRIÉTÉS D'ÉTAT =====
  agentDialog: boolean = false;
  deleteAgentDialog: boolean = false;
  deleteAgentsDialog: boolean = false;
  submitted: boolean = false;
  loading: boolean = false;
  isEdit: boolean = false;
  private subscriptions: Subscription[] = [];

  // ===== DONNÉES =====
  agents: Agent[] = [];
  loadedAgents: Agent[] = [];
  agent: Agent | null = null;
  selectedAgents: Agent[] = [];
  positions: Position[] = [];
  harbors: Harbor[] = [];
  jobs: Job[] = [];
  totalRecords: number = 0;
  connectedAgent: Agent | null = null;

  // ===== CONFIGURATION TABLEAU =====
  cols: any[] = [];
  rowsPerPageOptions: number[] = [10, 20, 30, 50];
  lastTableLazyLoadEvent: LazyLoadEvent | null = null;

  // ===== RÉFÉRENCES =====
  @ViewChild('dt') dataTable!: Table;

  // ===== FORMULAIRES =====
  myForm!: FormGroup;
  pwdForm!: FormGroup;
  searchForm!: FormGroup;

  // ===== ÉNUMÉRATIONS =====
  roles = Role;
  keys: string[] = [];
  gender = Gender;
  genders: any[] = [];

  constructor(
    private agentService: AgentService,
    private positionService: PositionService,
    private harborService: HarborService,
    private jobService: JobService,
    private authenticationService: AuthenticationService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.keys = Object.keys(this.roles);
  }

  // ===== CYCLE DE VIE =====
  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // ===== MÉTHODES D'INITIALISATION =====
  private initializeComponent(): void {
    this.genders = [
      { label: 'HOMME', value: 'HOMME' },
      { label: 'FEMME', value: 'FEMME' }
    ];
    this.getConnectedAgent();
    this.initializeColumns();
    this.initializeForms();
    this.loadInitialData();
  }

  private initializeColumns(): void {
    this.cols = [
      { field: 'lastName', header: 'Nom', sortable: true },
      { field: 'firstName', header: 'Prénom', sortable: true },
      { field: 'registrationNumber', header: 'Matricule', sortable: true },
      { field: 'email', header: 'Email', sortable: true },
      { field: 'position', header: 'Poste', sortable: true },
      { field: 'job', header: 'Fonction', sortable: true },
      { field: 'harbor', header: 'Port', sortable: true },
      { field: 'role', header: 'Rôle', sortable: true },
    ];
  }

  private initializeForms(): void {
    // Validateur d'âge
    const ageRangeValidator = (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const birthDate = new Date(control.value);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      return age >= 18 ? null : { ageRange: true };
    };

    // Formulaire principal
    this.myForm = new FormGroup({
      id: new FormControl(''),
      registrationNumber: new FormControl({ value: '', disabled: true }, [Validators.required]),
      firstName: new FormControl({ value: '', disabled: true }, [
        Validators.pattern("[A-Za-z _àâéêèëìïîôùçæœÀÂÉÊÈËÌÏÎÔÙÛÇÆŒ-]+"),
        Validators.required
      ]),
      lastName: new FormControl({ value: '', disabled: true }, [
        Validators.pattern("[A-Za-z _àâéêèëìïîôùçæœÀÂÉÊÈËÌÏÎÔÙÛÇÆŒ-]+"),
        Validators.required
      ]),
      email: new FormControl('', [Validators.email]),
      phoneNumber: new FormControl('', [
        Validators.pattern("^[0-9]{8}$"),
        Validators.minLength(8),
        Validators.maxLength(8)
      ]),
      gender: new FormControl('', Validators.required),
      cin: new FormControl({ value: '', disabled: true }, [
        Validators.pattern("^[0-9]{8}$"),
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(8)
      ]),
      dob: new FormControl({ value: '', disabled: true }, [ageRangeValidator, Validators.required]),
      position: new FormControl({ value: '', disabled: true }, Validators.required),
      recruitmentDate: new FormControl({ value: '', disabled: true }),
      startingDate: new FormControl({ value: '', disabled: true }),
      retirementDate: new FormControl({ value: '', disabled: true }),
      harbor: new FormControl({ value: '', disabled: true }, Validators.required),
      job: new FormControl({ value: '', disabled: true }, Validators.required),
      grade: new FormControl({ value: '', disabled: true }),
      employment: new FormControl({ value: '', disabled: true }),
      college: new FormControl({ value: '', disabled: true }),
      username: new FormControl({ value: '', disabled: true }, [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern("^[a-zA-Z0-9_]+$")
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6)
      ]),
      confirmPassword: new FormControl(''),
      role: new FormControl('', Validators.required),
    }, { validators: [usernameExistsValidator, regNumberExistsValidator, passwordMatchingValidator] });

    // Formulaire de changement de mot de passe
    this.pwdForm = new FormGroup({
      password: new FormControl('', [
        Validators.minLength(6)
      ]),
      confirmPassword: new FormControl(''),
    }, { validators: [passwordMatchingValidator] });

    // Formulaire de recherche
    this.searchForm = new FormGroup({
      matricule: new FormControl('', [
        Validators.maxLength(20)
      ])
    });
  }

  private loadInitialData(): void {
    this.getPositions();
    this.getHarbors();
    this.getJobs();
  }

  // ===== CHARGEMENT DES DONNÉES =====
  getAgents(): void {
    this.subscriptions.push(
      this.agentService.getAgents().subscribe({
        next: (response: Agent[]) => {
          this.agents = response;
          AGENTS_LIST = this.agents;
          this.totalRecords = response.length;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur chargement agents:', error);
          this.agents = [];
          this.totalRecords = 0;
        }
      })
    );
  }

  getConnectedAgent(): void {
    this.subscriptions.push(
      this.agentService.getAgentByToken().subscribe({
        next: (response: Agent) => {
          this.connectedAgent = response;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur chargement agent connecté:', error);
        }
      })
    );
  }

  getPositions(): void {
    this.subscriptions.push(
      this.positionService.getPositions().subscribe({
        next: (response: Position[]) => {
          this.positions = response;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur chargement positions:', error);
          this.positions = [];
        }
      })
    );
  }

  getHarbors(): void {
    this.subscriptions.push(
      this.harborService.getHarbors().subscribe({
        next: (response: Harbor[]) => {
          this.harbors = response;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur chargement ports:', error);
          this.harbors = [];
        }
      })
    );
  }

  getJobs(): void {
    this.subscriptions.push(
      this.jobService.getJobs().subscribe({
        next: (response: Job[]) => {
          this.jobs = response;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur chargement fonctions:', error);
          this.jobs = [];
        }
      })
    );
  }

  // ===== GESTION DU TABLEAU AVEC LAZY LOADING =====
  loadDataLazy(event: LazyLoadEvent): void {
    this.lastTableLazyLoadEvent = event;
    this.loading = true;

    const pageableData: Pageable = {
      page: Math.floor((event.first ?? 0) / (event.rows ?? 10)),
      size: event.rows ?? 10
    };

    if (event.sortField) {
      const sortOrder = event.sortOrder === -1 ? 'desc' : 'asc';
      pageableData.sort = `${event.sortField},${sortOrder}`;
    }

    this.refreshTable(pageableData);
  }

  refreshTable(pageable?: Pageable): void {
    const pageableData: Pageable = pageable || { page: 0, size: 10 };

    if (!pageable) {
      this.dataTable.first = 0;
    }

    const matricule = this.searchForm.get('matricule')?.value;

    this.subscriptions.push(
      this.agentService.getAgentsSearch(pageableData, matricule).subscribe({
        next: (dataPaginated) => {
          this.loadedAgents = dataPaginated['content'] || [];
          this.totalRecords = dataPaginated['totalElements'] || 0;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement paginé:', error);
          this.loading = false;
          this.loadedAgents = [];
          this.totalRecords = 0;
        }
      })
    );
  }

  // ===== GESTION DES AGENTS =====
  saveAgent(): void {
    if (this.myForm.invalid) {
      this.markFormGroupTouched(this.myForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulaire invalide',
        detail: 'Veuillez remplir tous les champs obligatoires',
        life: 3000
      });
      return;
    }

    const agentData = this.buildAgentFromForm();

    this.subscriptions.push(
      this.agentService.addAgent(agentData).subscribe({
        next: () => {
          this.getAgents();
          if (this.lastTableLazyLoadEvent) {
            this.loadDataLazy(this.lastTableLazyLoadEvent);
          }
          this.hideDialog();
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Agent enregistré avec succès',
            life: 3000
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur enregistrement agent:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: "Échec de l'enregistrement",
            life: 5000
          });
        }
      })
    );
  }

  private parseDate(dateStr: any): Date | null {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const str = dateStr.toString();
    if (str.includes('/')) {
      const parts = str.split('/');
      if (parts.length === 3) {
        return new Date(+parts[2], +parts[1] - 1, +parts[0]);
      }
    }
    return new Date(str);
  }

  private buildAgentFromForm(): Agent {
    return {
      id: this.myForm.get('id')?.value,
      user: {
        registrationNumber: this.myForm.get('registrationNumber')?.value,
        firstName: this.myForm.get('firstName')?.value,
        lastName: this.myForm.get('lastName')?.value,
        cin: this.myForm.get('cin')?.value,
        dob: this.myForm.get('dob')?.value,
        position: this.myForm.get('position')?.value,
        recruitmentDate: this.myForm.get('recruitmentDate')?.value,
        takePositionFrom: this.myForm.get('startingDate')?.value,
        harbor: this.myForm.get('harbor')?.value,
        job: this.myForm.get('job')?.value,
        grade: this.myForm.get('grade')?.value,
        employment: this.myForm.get('employment')?.value,
        college: this.myForm.get('college')?.value
      } as User,
      gender: this.myForm.get('gender')?.value,
      email: this.myForm.get('email')?.value,
      phoneNumber: this.myForm.get('phoneNumber')?.value,
      username: this.myForm.get('username')?.value,
      password: this.myForm.get('password')?.value,
      role: this.myForm.get('role')?.value
    };
  }

  editAgent(agent: Agent): void {
    this.agent = { ...agent };
    this.agentDialog = true;
    this.isEdit = true;

    this.myForm.patchValue({
      id: agent.id,
      registrationNumber: agent.user?.registrationNumber,
      firstName: agent.user?.firstName,
      lastName: agent.user?.lastName,
      email: agent.email,
      phoneNumber: agent.phoneNumber,
      gender: agent.gender,
      cin: agent.user?.cin,
      dob: agent.user?.birthDate ? this.parseDate(agent.user.birthDate) : null,
      position: agent.user?.position,
      recruitmentDate: agent.user?.recruitmentDate ? this.parseDate(agent.user.recruitmentDate) : null,
      startingDate: agent.user?.takePositionFrom ? this.parseDate(agent.user.takePositionFrom) : null,
      harbor: agent.user?.harbor,
      job: agent.user?.job,
      grade: agent.user?.grade,
      employment: agent.user?.employment,
      college: agent.user?.college,
      username: agent.username,
      role: agent.role
    });

    // En mode édition, s'assurer que les champs readonly sont désactivés dans le form
    const disabledFields = [
      'registrationNumber', 'firstName', 'lastName', 'cin', 'dob',
      'position', 'recruitmentDate', 'startingDate', 'harbor',
      'job', 'grade', 'employment', 'college', 'username'
    ];
    disabledFields.forEach(field => this.myForm.get(field)?.disable());

    // Désactiver les champs non modifiables en mode édition
    this.myForm.get('password')?.clearValidators();
    this.myForm.get('password')?.updateValueAndValidity();
    this.myForm.get('confirmPassword')?.clearValidators();
    this.myForm.get('confirmPassword')?.updateValueAndValidity();
  }

  hideDialog(): void {
    this.agentDialog = false;
    this.submitted = false;
    this.isEdit = false;
    this.myForm.reset();
    this.pwdForm.reset();

    // Réactiver les validateurs pour le mode création
    this.myForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.myForm.get('password')?.updateValueAndValidity();

    // Réactiver les champs pour le mode création
    this.myForm.enable();
    // Mais garder certains champs désactivés s'ils sont censés l'être dès le début (ex: id)
    // Ici on suppose que tout peut être saisi à la création
  }

  deleteAgent(agent: Agent): void {
    this.agent = agent;
    this.deleteAgentDialog = true;
  }

  confirmDelete(): void {
    if (!this.agent?.id) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Aucun agent sélectionné',
        life: 3000
      });
      return;
    }

    this.subscriptions.push(
      this.agentService.deleteAgent(this.agent.id).subscribe({
        next: () => {
          this.getAgents();
          if (this.lastTableLazyLoadEvent) {
            this.loadDataLazy(this.lastTableLazyLoadEvent);
          }
          this.deleteAgentDialog = false;
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Agent supprimé avec succès',
            life: 3000
          });
        },
        error: (error: HttpErrorResponse) => {
          console.error('Erreur suppression agent:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Échec de la suppression',
            life: 5000
          });
        }
      })
    );
  }

  deleteSelectedAgents(): void {
    if (!this.selectedAgents?.length) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Aucun agent sélectionné',
        life: 3000
      });
      return;
    }
    this.deleteAgentsDialog = true;
  }

  confirmDeleteSelected(): void {
    // TODO: Implémenter la suppression multiple selon votre API
    this.deleteAgentsDialog = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Agents supprimés avec succès',
      life: 3000
    });
    this.selectedAgents = [];
  }

  // ===== GESTION DES RÔLES =====
  getAgentRole(): string {
    return this.authenticationService.getAgentRoleFromLocalCache() || '';
  }

  get isAdmin(): boolean {
    return this.getAgentRole() === Role.ADMIN;
  }

  get isManager(): boolean {
    return this.isAdmin;
  }

  // ===== NAVIGATION =====
  loadAgent(id: number): void {
    this.router.navigate(['/agents/', id]);
  }

  // ===== UTILITAIRES =====
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  resetSearch(): void {
    this.searchForm.reset();
    this.refreshTable();
  }
}