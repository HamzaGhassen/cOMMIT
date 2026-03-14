import { Component, AfterViewInit, OnDestroy, Renderer2, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppComponent } from './app.component';
import { ConfigService } from './services/config-service/app.config.service';
import { AppConfig } from './api/appconfig';
import { AuthenticationService } from './services/authenticationService';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AgentService } from './services/agent.service';
import { Agent } from 'src/shared/Agent';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements AfterViewInit, OnDestroy, OnInit {
  // ============================================
  // 1. PROPRIÉTÉS DE LA SIDEBAR (À GARDER)
  // ============================================
  public menuCollapsed: boolean = false;        // État réduit/agrandi
  public menuInactiveDesktop: boolean = false;  // Menu inactif desktop
  public menuActiveMobile: boolean = false;     // Menu actif mobile
  public overlayMenuActive: boolean = false;    // Mode overlay
  public staticMenuInactive: boolean = false;   // Mode statique

  // ============================================
  // 2. PROPRIÉTÉS DU TOPBAR (À GARDER)
  // ============================================
  public topMenuActive: boolean = false;        // Menu du haut actif
  public topMenuLeaving: boolean = false;       // Animation de sortie
  public profileActive: boolean = false;        // Profil actif
  public notificationsActive: boolean = false;   // Notifications actives
  public messagesActive: boolean = false;        // Messages actifs

  // ============================================
  // 3. PROPRIÉTÉS DE CONFIGURATION (À GARDER)
  // ============================================
  public configActive: boolean = false;         // Panneau config actif
  public configClick: boolean = false;          // Clic sur config
  public config: AppConfig;                      // Configuration
  public theme: string = 'light';                // Thème
  public currentPageTitle: string = 'Tableau de bord'; // Titre page

  // ============================================
  // 4. NOUVELLES PROPRIÉTÉS POUR L'UTILISATEUR
  // ============================================
  public userName: string = '';
  public userRole: string = '';
  public userInitials: string = '';
  public notificationCount: number = 3; // À connecter avec votre service de notifications
  public messageCount: number = 5; // À connecter avec votre service de messages
  private jwtHelper = new JwtHelperService();

  // ============================================
  // 5. PROPRIÉTÉS PRIVÉES (À GARDER)
  // ============================================
  private documentClickListener: () => void;
  private menuClick: boolean = false;
  private topMenuButtonClick: boolean = false;
  private subscription: Subscription;

  constructor(
    public renderer: Renderer2,
    public app: AppComponent,
    public configService: ConfigService,
    private authenticationService: AuthenticationService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private agentService: AgentService
  ) { }

  // ============================================
  // 6. CYCLE DE VIE (MODIFIÉ)
  // ============================================
  ngOnInit(): void {
    this.config = this.configService.config;
    this.subscription = this.configService.configUpdate$.subscribe(
      config => this.config = config
    );

    // Charger les informations de l'utilisateur depuis le token
    this.loadUserInfo();

    // Gestion dynamique du titre de la page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateTitle();
    });

    // Initial check for current route title
    this.updateTitle();
  }

  private updateTitle(): void {
    let route = this.activatedRoute.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    if (route.snapshot.data['title']) {
      this.currentPageTitle = route.snapshot.data['title'];
    } else {
      this.currentPageTitle = 'Tableau de bord';
    }
  }

  ngAfterViewInit(): void {
    this.setupDocumentClickListener();
  }

  ngOnDestroy(): void {
    this.cleanupListeners();
  }

  // ============================================
  // 7. NOUVELLE MÉTHODE POUR CHARGER LES INFOS UTILISATEUR
  // ============================================
  private loadUserInfo(): void {
    if (this.authenticationService.isLoggedIn()) {
      this.authenticationService.loadToken();
      const token = this.authenticationService.getToken();

      if (token) {
        try {
          const decodedToken = this.jwtHelper.decodeToken(token);

          // Récupérer le nom d'utilisateur depuis le token (sub)
          this.userName = decodedToken.sub || 'Utilisateur';

          this.agentService.getAgentByToken().subscribe(
            (agent: Agent) => {
              if (agent && agent.user) {
                this.userName = `${agent.user.firstName} ${agent.user.lastName}`;
                this.generateInitials();
              }
            },
            (error) => console.error('Erreur agent', error)
          );

          // Récupérer le rôle depuis le token
          let roles = decodedToken.roles;
          if (roles) {
            let role: string = Array.isArray(roles) ? roles[0] : roles;
            if (role?.toUpperCase().startsWith('ROLE_')) {
              role = role.substring(5);
            }
            this.userRole = this.formatRole(role || '');
          } else {
            this.userRole = this.authenticationService.getAgentRoleFromLocalCache() || 'Utilisateur';
          }

          // Générer les initiales
          this.generateInitials();

        } catch (error) {
          console.error('Erreur lors du décodage du token', error);
          this.userName = 'Utilisateur';
          this.userRole = this.authenticationService.getAgentRoleFromLocalCache() || 'Utilisateur';
          this.generateInitials();
        }
      } else {
        // Fallback aux données du localStorage
        this.userRole = this.authenticationService.getAgentRoleFromLocalCache() || 'Utilisateur';
        this.userName = 'Utilisateur';
        this.generateInitials();
      }
    } else {
      // Si non connecté, rediriger vers login
      this.router.navigate(['/login']);
    }
  }

  private formatRole(role: string): string {
    if (!role) return '';

    // Formater le rôle (ex: ADMIN -> Admin, GESTIONNAIRE_EPI -> Gestionnaire EPI)
    return role.toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private generateInitials(): void {
    if (this.userName && this.userName !== 'Utilisateur') {
      // Prendre les premières lettres du nom d'utilisateur
      const parts = this.userName.split(/[.@_\-]/);
      if (parts.length >= 2) {
        this.userInitials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      } else {
        this.userInitials = this.userName.substring(0, 2).toUpperCase();
      }
    } else {
      this.userInitials = 'U';
    }
  }

  // ============================================
  // 8. GESTION DES CLICS (À GARDER)
  // ============================================
  private setupDocumentClickListener(): void {
    this.documentClickListener = this.renderer.listen('body', 'click', (event) => {
      if (!this.isDesktop()) {
        if (!this.menuClick) this.menuActiveMobile = false;
        if (!this.topMenuButtonClick) this.hideTopMenu();
      } else {
        if (!this.menuClick && this.isOverlay()) this.menuInactiveDesktop = true;
        if (!this.menuClick) this.overlayMenuActive = false;
      }

      if (this.configActive && !this.configClick) this.configActive = false;
      if (!this.menuClick && !this.topMenuButtonClick) {
        this.profileActive = false;
        this.notificationsActive = false;
        this.messagesActive = false;
      }

      this.resetClickFlags();
    });
  }

  private resetClickFlags(): void {
    this.configClick = false;
    this.menuClick = false;
    this.topMenuButtonClick = false;
  }

  private cleanupListeners(): void {
    if (this.documentClickListener) this.documentClickListener();
    if (this.subscription) this.subscription.unsubscribe();
  }

  // ============================================
  // 9. MÉTHODES DU MENU (À GARDER)
  // ============================================
  toggleMenu(event: Event): void {
    this.menuClick = true;

    if (this.isDesktop()) {
      if (this.app.menuMode === 'overlay') {
        this.overlayMenuActive = !this.overlayMenuActive;
        this.menuActiveMobile = false;
      } else if (this.app.menuMode === 'static') {
        this.staticMenuInactive = !this.staticMenuInactive;
      }
    } else {
      this.menuActiveMobile = !this.menuActiveMobile;
      this.topMenuActive = false;
    }

    event.preventDefault();
  }

  toggleMenuCollapse(): void {
    this.menuCollapsed = !this.menuCollapsed;
  }

  // ============================================
  // 10. MÉTHODES DU TOPBAR (MODIFIÉES)
  // ============================================
  toggleTopMenu(event: Event): void {
    this.topMenuButtonClick = true;
    this.menuActiveMobile = false;

    if (this.topMenuActive) {
      this.hideTopMenu();
    } else {
      this.topMenuActive = true;
    }

    event.preventDefault();
  }

  hideTopMenu(): void {
    this.topMenuLeaving = true;
    setTimeout(() => {
      this.topMenuActive = false;
      this.topMenuLeaving = false;
    }, 1);
  }

  toggleNotifications(event: Event): void {
    this.notificationsActive = !this.notificationsActive;
    this.messagesActive = false;
    this.profileActive = false;
    event.stopPropagation();
  }

  toggleMessages(event: Event): void {
    this.messagesActive = !this.messagesActive;
    this.notificationsActive = false;
    this.profileActive = false;
    event.stopPropagation();
  }

  toggleProfileMenu(event: Event): void {
    this.profileActive = !this.profileActive;
    this.notificationsActive = false;
    this.messagesActive = false;
    event.stopPropagation();
  }

  onSearchClick(): void {
    this.topMenuButtonClick = true;
  }

  // ============================================
  // 11. NOUVELLES MÉTHODES POUR LES ACTIONS DU PROFIL
  // ============================================
  viewProfile(): void {
    this.profileActive = false;
    // Naviguer vers la page de profil - à adapter selon vos routes
    this.router.navigate(['/profile']);
  }

  editSettings(): void {
    this.profileActive = false;
    // Naviguer vers les paramètres - à adapter selon vos routes
    this.router.navigate(['/settings']);
  }

  help(): void {
    this.profileActive = false;
    // Naviguer vers l'aide - à adapter selon vos routes
    this.router.navigate(['/help']);
  }

  logout(): void {
    this.profileActive = false;
    this.authenticationService.logOut();
    this.router.navigate(['/login']);
  }

  viewNotifications(): void {
    this.notificationsActive = false;
    // Naviguer vers la page des notifications - à adapter
    this.router.navigate(['/notifications']);
  }

  viewMessages(): void {
    this.messagesActive = false;
    // Naviguer vers la page des messages - à adapter
    this.router.navigate(['/messages']);
  }

  search(event: any): void {
    const query = event.target.value;
    if (query && query.length > 2) {
      // Naviguer vers la page de recherche - à adapter
      this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/images/default-avatar.png';
  }

  // ============================================
  // 12. MÉTHODES DE CONFIGURATION (À GARDER)
  // ============================================
  onConfigClick(event: any): void {
    this.configClick = true;
    this.configActive = !this.configActive;
  }

  onMenuClick(): void {
    this.menuClick = true;
  }

  // ============================================
  // 13. MÉTHODES UTILITAIRES (À GARDER)
  // ============================================
  isStatic(): boolean {
    return this.app.menuMode === 'static';
  }

  isOverlay(): boolean {
    return this.app.menuMode === 'overlay';
  }

  isDesktop(): boolean {
    return window.innerWidth > 992;
  }

  isMobile(): boolean {
    return window.innerWidth < 1024;
  }
}