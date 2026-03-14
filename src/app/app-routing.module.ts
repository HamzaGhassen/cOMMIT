import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/* ================================
   Layout Component
================================ */
import { MainComponent } from './main.component';

/* ================================
   Authentication
================================ */
import { LoginComponent } from './components/login/login.component';

/* ================================
   Guards
================================ */
import { AuthenticationGuard } from './guard/authentication.guard';
import { HasRoleGuard } from './guard/has-role.guard';

/* ================================
   Error & Access Pages
================================ */
import { AccessComponent } from './components/access/access.component';
import { NotfoundComponent } from './components/notfound/notfound.component';
import { ErrorComponent } from './components/error/error.component';

/* ================================
   Feature Components
================================ */
import { ProfileComponent } from './components/profile/profile.component';
import { AgentComponent } from './components/agent/agent.component';
import { AgentDetailsComponent } from './components/agent/agent-details/agent-details.component';
import { EmplacementsComponent } from './components/emplacements/emplacements.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ReglesConservationComponent } from './components/regles-conservation/regles-conservation.component';
/* ================================
   Role Constants
================================ */
const ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  ALL: ['ADMIN', 'USER']
} as const;

/* ================================
   Application Routes
================================ */
const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    canActivate: [AuthenticationGuard],
    children: [

      /* Default Dashboard */
      {
        path: '',
        component: DashboardComponent,
        data: { title: 'Tableau de bord' }
      },

      /* User Profile */
      {
        path: 'profile',
        component: ProfileComponent,
        data: { title: 'Mon Profil' }
      },

      /* ==========================
         ADMIN ROUTES
      ========================== */

      {
        path: 'agents',
        component: AgentComponent,
        canActivate: [HasRoleGuard],
        data: { role: ROLES.ALL, title: 'Gestion des Agents' }
      },
      {
        path: 'agents/:id',
        component: AgentDetailsComponent,
        canActivate: [HasRoleGuard],
        data: { role: ROLES.ALL, title: 'Détails de l\'Agent' }
      },
      {
        path: 'emplacements',
        component: EmplacementsComponent,
        canActivate: [HasRoleGuard],
        data: { role: ROLES.ALL, title: 'Gestion des Emplacements' }
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [HasRoleGuard],
        data: { role: ROLES.ALL, title: 'Tableau de bord' }
      },
      {
        path: 'regles',
        component: ReglesConservationComponent,
        canActivate: [HasRoleGuard],
        data: { role: ROLES.ALL, title: 'Règles de conservation' }
      },
    ]
  },

  /* ================================
     Public Routes
  ================================ */

  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'access',
    component: AccessComponent
  },
  {
    path: 'notfound',
    component: NotfoundComponent
  },
  {
    path: 'error',
    component: ErrorComponent
  },

  /* Fallback Route */
  {
    path: '**',
    redirectTo: 'notfound'
  }
];

/* ================================
   Module Declaration
================================ */
@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }