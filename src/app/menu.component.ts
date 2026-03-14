import { Component, OnInit } from '@angular/core';
import { MainComponent } from './main.component';
import { AuthenticationService } from './services/authenticationService';

export interface MenuItem {
  label: string;
  icon: string;
  routerLink: string[];
  badge?: string;
  badgeClass?: string;
  visible?: boolean;
}

@Component({
  selector: 'app-menu',
  template: `
    <aside class="sidebar" [class.sidebar-collapsed]="appMain.menuCollapsed">

      <!-- Logo simple -->
      <div class="sidebar-header">
        <div class="logo-wrapper">
          <img src="assets/layout/images/logo-removebg.png" 
               alt="Logo" 
               class="sidebar-logo"
               [class.logo-small]="appMain.menuCollapsed">
        </div>
      </div>

      <!-- Bouton de réduction -->
      <div class="collapse-wrapper">
        <button class="collapse-btn" (click)="toggleSidebar()">
          <i class="pi" [ngClass]="appMain.menuCollapsed ? 'pi-chevron-right' : 'pi-chevron-left'"></i>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <ul class="nav-list">
          <li *ngFor="let item of menuItems">
            <a [routerLink]="item.routerLink"
               routerLinkActive="active"
               class="nav-item">
              
              <!-- Icône simple -->
              <div class="icon-wrapper">
                <i [class]="item.icon"></i>
              </div>
              
              <div class="item-content" *ngIf="!appMain.menuCollapsed">
                <span class="item-label">{{ item.label }}</span>
                <span *ngIf="item.badge" class="item-badge">{{ item.badge }}</span>
              </div>

              <span class="tooltip-text" *ngIf="appMain.menuCollapsed">
                {{ item.label }}
              </span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- Footer simple -->
      <div class="sidebar-footer"></div>

    </aside>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }

    /* ===== SIDEBAR AVEC DÉGRADÉ BLEU-BLANC ===== */
    .sidebar {
      width: 280px;
      height: 100vh;
      background: linear-gradient(145deg, 
        #ffffff 0%,
        #e6f0ff 25%,
        #b3d4ff 60%,
        #4d94ff 100%
      );
      color: #1e293b;
      position: fixed;
      inset: 0 auto 0 0;
      display: flex;
      flex-direction: column;
      box-shadow: 8px 0 30px rgba(0, 40, 80, 0.15);
      z-index: 1000;
      overflow: hidden;
      border-right: 1px solid rgba(255, 255, 255, 0.3);
      transition: width 0.3s ease;
    }

    /* Sidebar réduite */
    .sidebar.sidebar-collapsed {
      width: 80px;
    }

    .sidebar.sidebar-collapsed .item-content {
      display: none;
    }

    /* ===== EN-TÊTE AVEC LOGO ===== */
    .sidebar-header {
      padding: 30px 20px 25px;
      display: flex;
      justify-content: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.5);
      transition: padding 0.3s ease;
    }

    .sidebar-collapsed .sidebar-header {
      padding: 25px 10px;
    }

    .sidebar-logo {
      max-width: 150px;
      height: auto;
      transition: all 0.3s ease;
    }

    .sidebar-logo.logo-small {
      max-width: 45px;
    }

    /* ===== BOUTON DE RÉDUCTION ===== */
    .collapse-wrapper {
      display: flex;
      justify-content: flex-end;
      padding: 15px 20px;
    }

    .sidebar-collapsed .collapse-wrapper {
      justify-content: center;
      padding: 15px 0;
    }

    .collapse-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.5);
      color: #1e3a8a;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .collapse-btn:hover {
      background: rgba(255, 255, 255, 0.5);
      transform: scale(1.05);
    }

    /* ===== NAVIGATION ===== */
    .sidebar-nav {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      scrollbar-width: none;
    }

    .sidebar-nav::-webkit-scrollbar {
      display: none;
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 10px 16px;
      color: #1e293b;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      transition: all 0.2s ease;
      position: relative;
    }

    .sidebar-collapsed .nav-item {
      padding: 10px 0;
      justify-content: center;
    }

    /* ===== ICÔNES SIMPLES ===== */
    .icon-wrapper {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 8px;
      transition: all 0.2s ease;
    }

    .sidebar-collapsed .icon-wrapper {
      width: 42px;
      height: 42px;
    }

    .nav-item i {
      font-size: 1.2rem;
      color: #1e3a8a;
      transition: all 0.2s ease;
    }

    .sidebar-collapsed .nav-item i {
      font-size: 1.4rem;
    }

    .item-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .item-label {
      font-weight: 500;
    }

    /* ===== BADGES ===== */
    .item-badge {
      padding: 4px 8px;
      border-radius: 30px;
      font-size: 0.65rem;
      font-weight: 600;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    }

    /* ===== SURVOL ===== */
    .nav-item:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateX(4px);
    }

    .sidebar-collapsed .nav-item:hover {
      transform: scale(1.05);
    }

    .nav-item:hover .icon-wrapper {
      background: rgba(255, 255, 255, 0.6);
    }

    .nav-item:hover i {
      color: #1d4ed8;
    }

    /* ===== ÉLÉMENT ACTIF ===== */
    .nav-item.active {
      background: rgba(255, 255, 255, 0.4);
      border-color: rgba(255, 255, 255, 0.8);
    }

    .nav-item.active .icon-wrapper {
      background: white;
    }

    .nav-item.active i {
      color: #1d4ed8;
    }

    .nav-item.active::before {
      content: '';
      position: absolute;
      left: -2px;
      top: 20%;
      bottom: 20%;
      width: 4px;
      background: linear-gradient(to bottom, #3b82f6, #1d4ed8);
      border-radius: 4px;
    }

    /* ===== TOOLTIP SIMPLE ===== */
    .tooltip-text {
      visibility: hidden;
      position: absolute;
      left: 100%;
      top: 50%;
      transform: translateY(-50%);
      background: #1e293b;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      white-space: nowrap;
      margin-left: 10px;
      z-index: 1000;
    }

    .nav-item:hover .tooltip-text {
      visibility: visible;
    }

    /* ===== FOOTER ===== */
    .sidebar-footer {
      padding: 16px 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.5);
      min-height: 16px;
    }

    .sidebar-collapsed .sidebar-footer {
      padding: 16px 0;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1024px) {
      .sidebar {
        width: 240px;
      }

      .sidebar.sidebar-collapsed {
        width: 70px;
      }

      .sidebar-logo {
        max-width: 130px;
      }

      .sidebar-logo.logo-small {
        max-width: 40px;
      }
    }
  `]
})
export class AppMenuComponent implements OnInit {
  currentRole!: string;
  menuItems: MenuItem[] = [
    { label: 'Tableau de bord', icon: 'fa-solid fa-chart-pie', routerLink: ['/dashboard'] },
    { label: 'Agents', icon: 'fa-solid fa-users', routerLink: ['/agents'] },
    { label: 'Archives', icon: 'fa-solid fa-folder', routerLink: ['/archives'] },
    { label: 'Bordereaux', icon: 'fa-solid fa-file-lines', routerLink: ['/bordereaux'] },
    { label: 'Emplacements', icon: 'fa-solid fa-location-dot', routerLink: ['/emplacements'] },
    { label: 'Règles de conservation', icon: 'fa-solid fa-shield', routerLink: ['/regles'] },
    { label: 'Alertes', icon: 'fa-solid fa-triangle-exclamation', routerLink: ['/alertes'], badge: '3' }
  ];

  constructor(
    public appMain: MainComponent,
    private auth: AuthenticationService
  ) {
    this.currentRole = this.auth.getAgentRoleFromLocalCache();
  }

  ngOnInit(): void { }


  toggleSidebar(): void {
    this.appMain.menuCollapsed = !this.appMain.menuCollapsed;

    // Dispatch event for any other components that need to know
    window.dispatchEvent(new CustomEvent('sidebarToggle', {
      detail: { collapsed: this.appMain.menuCollapsed }
    }));

    // Save to localStorage
    localStorage.setItem('menuCollapsed', JSON.stringify(this.appMain.menuCollapsed));
  }
}