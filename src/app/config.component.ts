import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppConfig } from './api/appconfig';
import { AppComponent } from './app.component';
import { MainComponent } from './main.component';
import { ConfigService } from './services/config-service/app.config.service';
import { PrimeNGConfig } from 'primeng/api';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit, OnDestroy {
  // ===== PROPRIÉTÉS =====
  scale: number = 14;
  scales: number[] = [12, 13, 14, 15, 16];
  config: AppConfig;
  
  // Thèmes disponibles avec dégradés
  themes: any[] = [
    { name: 'Bleu Dégradé', value: 'blue-gradient', dark: false },
    { name: 'Vert Dégradé', value: 'green-gradient', dark: false },
    { name: 'Violet Dégradé', value: 'purple-gradient', dark: false },
    { name: 'Orange Dégradé', value: 'orange-gradient', dark: false },
    { name: 'Rouge Dégradé', value: 'red-gradient', dark: false },
    { name: 'Gris Dégradé', value: 'gray-gradient', dark: false },
    { name: 'Bleu Nuit', value: 'blue-gradient', dark: true },
    { name: 'Vert Forêt', value: 'green-gradient', dark: true },
    { name: 'Violet Nuit', value: 'purple-gradient', dark: true }
  ];

  // ===== ABONNEMENTS =====
  private subscription: Subscription;

  // ===== CONSTRUCTEUR =====
  constructor(
    public app: AppComponent,
    public appMain: MainComponent,
    public configService: ConfigService,
    public primengConfig: PrimeNGConfig
  ) { }

  // ===== CYCLE DE VIE =====
  ngOnInit(): void {
    this.initializeConfig();
    this.applyGradientTheme(); // Appliquer le dégradé au démarrage
  }

  ngOnDestroy(): void {
    this.cleanupSubscriptions();
  }

  // ===== MÉTHODES D'INITIALISATION =====
  /**
   * Initialise la configuration
   */
  private initializeConfig(): void {
    this.config = this.configService.config;
    this.subscription = this.configService.configUpdate$.subscribe(config => {
      this.config = config;
      this.scale = 14;
      this.applyScale();
      this.applyGradientTheme(); // Réappliquer le dégradé après mise à jour
    });
  }

  /**
   * Nettoie les abonnements
   */
  private cleanupSubscriptions(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Applique le thème dégradé à l'application
   */
  applyGradientTheme(): void {
    // Créer ou mettre à jour la feuille de style pour les dégradés
    let styleElement = document.getElementById('gradient-theme-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'gradient-theme-styles';
      document.head.appendChild(styleElement);
    }

    // Définir les styles de dégradé
    styleElement.innerHTML = `
      /* ===== SIDEBAR AVEC DÉGRADÉ ===== */
      .layout-sidebar {
        background: linear-gradient(145deg, 
          #ffffff 0%,
          #e6f0ff 25%,
          #b3d4ff 60%,
          #4d94ff 100%
        ) !important;
        background-size: 200% 200% !important;
        animation: gradientFlow 15s ease infinite !important;
        position: relative;
        overflow: hidden;
      }

      .layout-sidebar::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 70%);
        opacity: 0.7;
        animation: lightPulse 8s ease-in-out infinite;
        pointer-events: none;
      }

      /* ===== TOPBAR AVEC DÉGRADÉ ===== */
      .layout-topbar {
        background: rgba(255, 255, 255, 0.9) !important;
        backdrop-filter: blur(10px) !important;
        -webkit-backdrop-filter: blur(10px) !important;
        border-bottom: 1px solid rgba(59, 130, 246, 0.2) !important;
        box-shadow: 0 4px 20px rgba(0, 40, 80, 0.1) !important;
      }

      /* ===== BOUTON MENU AVEC DÉGRADÉ ===== */
      .menu-button, .layout-menu-button {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
        border: none !important;
        color: white !important;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
      }

      .menu-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4) !important;
      }

      /* ===== TITRES AVEC DÉGRADÉ ===== */
      .page-title, h1 {
        background: linear-gradient(135deg, #1e3a8a, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      /* ===== CARTES AVEC EFFET ===== */
      .content-card, .epi-card, .card {
        background: white !important;
        border-radius: 16px !important;
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1) !important;
        border: 1px solid rgba(59, 130, 246, 0.1) !important;
        transition: all 0.3s ease !important;
      }

      .content-card:hover, .epi-card:hover {
        box-shadow: 0 8px 30px rgba(59, 130, 246, 0.2) !important;
        border-color: #3b82f6 !important;
      }

      /* ===== BADGES AVEC DÉGRADÉ ===== */
      .badge, .notification-badge {
        background: linear-gradient(135deg, #ef4444, #dc2626) !important;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3) !important;
      }

      /* ===== AVATAR UTILISATEUR AVEC DÉGRADÉ ===== */
      .user-avatar {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
        box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3) !important;
      }

      /* ===== BARRE DE PROGRESSION ===== */
      .progress-fill {
        background: linear-gradient(90deg, #3b82f6, #6366f1) !important;
      }

      /* ===== TAUX DE REMPLISSAGE ===== */
      .fill-rate {
        background: linear-gradient(90deg, #3b82f6, #6366f1);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      /* ===== ANIMATIONS ===== */
      @keyframes gradientFlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes lightPulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 0.9; }
      }

      /* ===== SCROLLBAR ===== */
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #3b82f6, #1d4ed8) !important;
        border-radius: 4px;
      }
    `;
  }

  // ===== GESTION DU BOUTON DE CONFIGURATION =====
  /**
   * Gère le clic sur le bouton de configuration
   * @param event - Événement de clic
   */
  onConfigButtonClick(event: Event): void {
    this.appMain.configActive = !this.appMain.configActive;
    this.appMain.configClick = true;
    event.preventDefault();
  }

  // ===== GESTION DE L'ÉCHELLE =====
  /**
   * Incrémente l'échelle
   */
  incrementScale(): void {
    if (this.scale < this.scales[this.scales.length - 1]) {
      this.scale++;
      this.applyScale();
    }
  }

  /**
   * Décrémente l'échelle
   */
  decrementScale(): void {
    if (this.scale > this.scales[0]) {
      this.scale--;
      this.applyScale();
    }
  }

  /**
   * Applique l'échelle au document
   */
  applyScale(): void {
    document.documentElement.style.fontSize = this.scale + 'px';
  }

  // ===== GESTION DES OPTIONS =====
  /**
   * Gère le changement d'effet ondulatoire
   * @param ripple - État de l'effet ondulatoire
   */
  onRippleChange(ripple: boolean): void {
    this.primengConfig.ripple = ripple;
    this.updateConfig({ ripple });
  }

  /**
   * Gère le changement de style de saisie
   */
  onInputStyleChange(): void {
    this.updateConfig(this.config);
  }

  /**
   * Gère le changement de thème
   * @param theme - Nom du thème
   * @param dark - Mode sombre ou clair
   */
  changeTheme(theme: string, dark: boolean): void {
    const themeElement = document.getElementById('theme-css') as HTMLLinkElement;
    if (themeElement) {
      themeElement.setAttribute('href', `assets/theme/${theme}/theme.css`);
    }
    this.updateConfig({ theme, dark });
  }

  // ===== MISE À JOUR DE LA CONFIGURATION =====
  /**
   * Met à jour la configuration
   * @param updates - Mises à jour partielles de la configuration
   */
  private updateConfig(updates: Partial<AppConfig>): void {
    this.configService.updateConfig({ ...this.config, ...updates });
  }

  // ===== GETTERS UTILES =====
  /**
   * Vérifie si l'échelle est au minimum
   */
  get isMinScale(): boolean {
    return this.scale === this.scales[0];
  }

  /**
   * Vérifie si l'échelle est au maximum
   */
  get isMaxScale(): boolean {
    return this.scale === this.scales[this.scales.length - 1];
  }

  /**
   * Retourne le libellé du style de saisie actuel
   */
  get inputStyleLabel(): string {
    return this.config.inputStyle === 'outlined' ? 'Décrit' : 'Remplie';
  }

  /**
   * Retourne le libellé de l'effet ondulatoire
   */
  get rippleLabel(): string {
    return this.config.ripple ? 'Activé' : 'Désactivé';
  }
}