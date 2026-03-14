import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthenticationService } from '../services/authenticationService';

@Injectable({
  providedIn: 'root'
})
export class HasRoleGuard implements CanActivate {

  constructor(private authenticationService : AuthenticationService, private router : Router){

  }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const currentRole = this.authenticationService.getAgentRoleFromLocalCache()?.toUpperCase();
      const exactRoles = route.data['role'];
      const roleContains = route.data['roleContains'];
    
      let isAuthorized = false;
    
      if (exactRoles) {
        isAuthorized = exactRoles.includes(currentRole);
      } else if (roleContains) {
        isAuthorized = roleContains.some(keyword => currentRole?.includes(keyword.toUpperCase()));
      }
    
      if (!isAuthorized) {
        this.router.navigate(['/access']);
      }
    
      return isAuthorized;
  }
  
}
