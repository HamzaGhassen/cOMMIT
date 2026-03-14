import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  providers: [MessageService]
})
export class DashboardComponent implements OnInit {
  currentDate: Date = new Date();
  userName: string = 'Admin';
  userRole: string = 'Administrateur';
  
  // Données pour les statistiques
  statsData = [
    { label: 'Agents actifs', value: 24, icon: 'pi pi-users', color: '#4f46e5', bgColor: '#eef2ff', change: '+12%' },
    { label: 'Archives', value: 156, icon: 'pi pi-folder', color: '#059669', bgColor: '#d1fae5', change: '+5%' },
    { label: 'Bordereaux', value: 89, icon: 'pi pi-file', color: '#b45309', bgColor: '#ffedd5', change: '-2%' },
    { label: 'Emplacements', value: 42, icon: 'pi pi-map-marker', color: '#7c3aed', bgColor: '#ede9fe', change: '+8%' }
  ];

  // Données pour le graphique d'activité
  chartData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    values: [65, 75, 85, 70, 95, 55, 45],
    colors: ['#4f46e5', '#4f46e5', '#4f46e5', '#4f46e5', '#4f46e5', '#4f46e5', '#4f46e5']
  };

  // Données pour les épis virtuels (3D)
  virtualEpis = [
    { id: 'ÉPI-01', name: 'Épi Principal A', dossiers: 234, occupation: 78, couleur: '#4f46e5' },
    { id: 'ÉPI-02', name: 'Épi Secondaire B', dossiers: 156, occupation: 52, couleur: '#059669' },
    { id: 'ÉPI-03', name: 'Épi Central C', dossiers: 312, occupation: 89, couleur: '#b45309' },
    { id: 'ÉPI-04', name: 'Épi Archive D', dossiers: 98, occupation: 33, couleur: '#7c3aed' },
    { id: 'ÉPI-05', name: 'Épi Document E', dossiers: 187, occupation: 62, couleur: '#db2777' },
    { id: 'ÉPI-06', name: 'Épi Stock F', dossiers: 143, occupation: 48, couleur: '#ea580c' }
  ];

  // Données pour les activités récentes
  recentActivities = [
    { user: 'Jean Dupont', action: 'a ajouté 5 dossiers dans ÉPI-01', time: 'il y a 5 min', avatar: 'JD', color: '#4f46e5' },
    { user: 'Marie Martin', action: 'a modifié l\'emplacement ÉPI-03', time: 'il y a 15 min', avatar: 'MM', color: '#059669' },
    { user: 'Pierre Durand', action: 'a archivé 12 bordereaux', time: 'il y a 30 min', avatar: 'PD', color: '#b45309' },
    { user: 'Sophie Lefebvre', action: 'a créé une alerte sur ÉPI-02', time: 'il y a 1 h', avatar: 'SL', color: '#7c3aed' }
  ];

  // Alertes
  alerts = [
    { type: 'warning', message: 'ÉPI-03 atteint 89% de capacité', time: 'il y a 10 min' },
    { type: 'info', message: 'Mise à jour système à 18h', time: 'il y a 30 min' },
    { type: 'success', message: 'Synchronisation terminée', time: 'il y a 1 h' }
  ];

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    // Récupérer les infos depuis le localStorage ou un service
    const storedName = localStorage.getItem('userName');
    const storedRole = localStorage.getItem('userRole');
    
    if (storedName) this.userName = storedName;
    if (storedRole) this.userRole = storedRole;
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  refreshData(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Rafraîchi',
      detail: 'Données mises à jour',
      life: 2000
    });
  }
}