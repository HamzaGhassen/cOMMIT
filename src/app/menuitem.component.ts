import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MenuService } from './services/config-service/app.menu.service';
import { MainComponent } from './main.component';

@Component({
  selector: '[app-menuitem]',
  template: `
    <ng-container *ngIf="item?.visible !== false">
      <!-- Lien avec URL externe ou parent de sous-menu -->
      <a *ngIf="!item?.routerLink || item?.items"
         [attr.href]="item?.url"
         (click)="itemClick($event)"
         [ngClass]="item?.class"
         [attr.target]="item?.target"
         [attr.tabindex]="0"
         [attr.aria-label]="item?.label"
         role="menuitem"
         pRipple>
        <i [ngClass]="item?.icon" class="layout-menuitem-icon"></i>
        <span class="menuitem-text">{{ item?.label }}</span>
        <span class="badge-text" *ngIf="item?.badge">{{ item?.badge }}</span>
        <i class="pi pi-fw {{ active ? 'pi-angle-up' : 'pi-angle-down' }} ml-auto" 
           *ngIf="item?.items"></i>
      </a>

      <!-- Lien avec routerLink interne (sans sous-menu) -->
      <a *ngIf="item?.routerLink && !item?.items"
         (click)="itemClick($event)"
         [ngClass]="item?.class"
         [routerLink]="item?.routerLink"
         routerLinkActive="active-menuitem-routerlink router-link-exact-active"
         [routerLinkActiveOptions]="{ exact: !item?.preventExact }"
         [attr.target]="item?.target"
         [attr.tabindex]="0"
         [attr.aria-label]="item?.label"
         role="menuitem"
         pRipple>
        <i [ngClass]="item?.icon" class="layout-menuitem-icon"></i>
        <span class="menuitem-text">{{ item?.label }}</span>
        <span class="badge-text" *ngIf="item?.badge">{{ item?.badge }}</span>
        <i class="pi pi-fw {{ active ? 'pi-angle-up' : 'pi-angle-down' }} ml-auto" 
           *ngIf="item?.items"></i>
      </a>

      <!-- Sous-menu dépliant -->
      <ul *ngIf="item?.items && active"
          [@children]="'visibleAnimated'"
          role="menu">
        <ng-template ngFor let-child let-i="index" [ngForOf]="item.items">
          <li app-menuitem
              [item]="child"
              [index]="i"
              [parentKey]="key"
              role="none">
          </li>
        </ng-template>
      </ul>
    </ng-container>
  `,
  host: {
    '[class.active-menuitem]': 'active',
  },
  styles: [`
    /* ===== CONTENEUR PRINCIPAL ===== */
    :host {
      display: block;
      background-color: #ffffff !important;
    }

    /* ===== STYLES DES LIENS ===== */
    a {
      display: flex;
      align-items: center;
      padding: 0.75rem 1.5rem;
      color: #4b5563 !important;
      background-color: #ffffff !important;
      text-decoration: none;
      transition: all 0.2s ease;
      border-left: 4px solid transparent;
      cursor: pointer;
      font-size: 0.95rem;
    }

    a:hover {
      background-color: #f3f4f6 !important;
      color: #1e3a8a !important;
    }

    a:hover i {
      color: #1e3a8a !important;
    }

    /* ===== STYLES DES ICÔNES ===== */
    i {
      margin-right: 0.75rem;
      color: #6b7280 !important;
      font-size: 1.25rem;
      transition: color 0.2s ease;
    }

    .layout-menuitem-icon {
      width: 1.5rem;
      text-align: center;
    }

    /* ===== STYLES DU TEXTE ===== */
    .menuitem-text {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 700;
    }

    /* ===== STYLES DES BADGES ===== */
    .badge-text {
      font-weight: 700;
      color: #dc2626;
      font-size: 0.95rem;
      margin-left: auto;
    }

    /* ===== STYLES DES SOUS-MENUS ===== */
    ul {
      background-color: #ffffff !important;
      padding: 0;
      margin: 0;
      list-style: none;
      overflow: hidden;
    }

    ul li a {
      padding-left: 3rem;
    }

    /* ===== STYLES DE L'ÉLÉMENT ACTIF ===== */
    .router-link-exact-active,
    .active-menuitem-routerlink,
    a.router-link-exact-active {
      background-color: #e6f2ff !important;
      border-left: 4px solid #1e3a8a !important;
      color: #1e3a8a !important;
    }

    .router-link-exact-active i,
    .active-menuitem-routerlink i,
    a.router-link-exact-active i {
      color: #1e3a8a !important;
    }

    .active-menuitem > a {
      background-color: #e6f2ff !important;
      border-left: 4px solid #1e3a8a !important;
      color: #1e3a8a !important;
    }

    .active-menuitem > a i {
      color: #1e3a8a !important;
    }

    /* ===== STYLES DES FLÈCHES ===== */
    .pi-angle-up,
    .pi-angle-down {
      margin-left: auto;
      font-size: 0.875rem;
      color: #9ca3af;
    }

    .ml-auto {
      margin-left: auto;
    }
  `],
  animations: [
    trigger('children', [
      state('void', style({ height: '0px' })),
      state('hiddenAnimated', style({ height: '0px' })),
      state('visibleAnimated', style({ height: '*' })),
      transition('visibleAnimated => hiddenAnimated',
        animate('400ms cubic-bezier(0.86, 0, 0.07, 1)')),
      transition('hiddenAnimated => visibleAnimated',
        animate('400ms cubic-bezier(0.86, 0, 0.07, 1)')),
      transition('void => visibleAnimated, visibleAnimated => void',
        animate('400ms cubic-bezier(0.86, 0, 0.07, 1)'))
    ])
  ]
})
export class MenuitemComponent implements OnInit, OnDestroy {
  // ===== PROPRIÉTÉS D'ENTRÉE =====
  @Input() item: any;
  @Input() index: number;
  @Input() root: boolean;
  @Input() parentKey: string;

  // ===== PROPRIÉTÉS D'ÉTAT =====
  active = false;
  key: string;

  // ===== ABONNEMENTS =====
  private menuSourceSubscription: Subscription;
  private menuResetSubscription: Subscription;

  constructor(
    public app: MainComponent,
    public router: Router,
    private cd: ChangeDetectorRef,
    private menuService: MenuService
  ) {
    this.setupMenuSubscriptions();
    this.setupRouterEvents();
  }

  ngOnInit(): void {
    this.initializeKey();
    this.updateActiveState();
  }

  ngOnDestroy(): void {
    this.cleanupSubscriptions();
  }

  // ===== MÉTHODES D'INITIALISATION =====

  /**
   * Configure les abonnements aux événements du menu
   */
  private setupMenuSubscriptions(): void {
    this.menuSourceSubscription = this.menuService.menuSource$.subscribe(key => {
      if (this.active && this.key !== key && key.indexOf(this.key) !== 0) {
        this.active = false;
      }
    });

    this.menuResetSubscription = this.menuService.resetSource$.subscribe(() => {
      this.active = false;
    });
  }

  /**
   * Configure les événements de navigation du routeur
   */
  private setupRouterEvents(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.updateActiveState());
  }

  /**
   * Initialise la clé unique de l'élément
   */
  private initializeKey(): void {
    this.key = this.parentKey ? `${this.parentKey}-${this.index}` : String(this.index);
  }

  /**
   * Met à jour l'état actif en fonction de la route courante
   */
  private updateActiveState(): void {
    if (!this.item?.routerLink) {
      this.active = false;
      return;
    }

    this.active = this.router.isActive(
      this.item.routerLink[0],
      !this.item.items
    );
  }

  // ===== GESTION DES ACTIONS =====

  /**
   * Gère le clic sur un élément du menu
   */
  itemClick(event: Event): void {
    event.stopPropagation();

    if (!this.item || this.item.disabled) {
      event.preventDefault();
      return;
    }

    this.notifyMenuStateChange();
    this.executeCommand(event);
    this.toggleActiveState();
    this.handleMobileMenu();
  }

  /**
   * Notifie le service du changement d'état
   */
  private notifyMenuStateChange(): void {
    this.menuService.onMenuStateChange(this.key);
  }

  /**
   * Exécute la commande personnalisée si elle existe
   */
  private executeCommand(event: Event): void {
    if (this.item.command) {
      this.item.command({ originalEvent: event, item: this.item });
    }
  }

  /**
   * Bascule l'état actif
   */
  private toggleActiveState(): void {
    if (this.item.items) {
      this.active = !this.active;
    } else {
      this.active = true;
    }
  }

  /**
   * Gère le comportement du menu mobile
   */
  private handleMobileMenu(): void {
    if (this.item.items) return;

    this.app.menuActiveMobile = false;

    if (this.app.isDesktop() && this.app.isOverlay()) {
      this.app.menuInactiveDesktop = true;
    }
  }

  // ===== NETTOYAGE =====

  /**
   * Nettoie les abonnements
   */
  private cleanupSubscriptions(): void {
    this.menuSourceSubscription?.unsubscribe();
    this.menuResetSubscription?.unsubscribe();
  }
}