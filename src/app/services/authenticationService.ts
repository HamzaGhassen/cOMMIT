import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Agent } from 'src/shared/Agent';

import { JwtHelperService } from "@auth0/angular-jwt";


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  public host = environment.baseUrl + "login/auth/authenticate" ;
  public refreshhost = environment.baseUrl + "login/auth/refresh-token" ;
  private token : string;
  private refreshtoken : string;
  private loggedInUsername : string;
  private jwtHelper = new JwtHelperService();
  expiredMsg : String;

  constructor( private http : HttpClient) {}

  public login(agent : Agent):Observable<HttpResponse<any> | HttpErrorResponse |any>{
    return this.http.post<HttpResponse<any> | HttpErrorResponse|any>(this.host,  {id: agent.username, password: agent.password} ,{observe : 'response'});
  }

  public refresh():Observable<HttpResponse<any> | HttpErrorResponse |any>{
    return this.http.post<HttpResponse<any> | HttpErrorResponse | any>(`${this.refreshhost}`, {observe: 'response' });
  }

  public saveToken(token : string): void {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  public saveRefreshToken(refreshtoken : string): void {
    this.refreshtoken = refreshtoken;
    localStorage.setItem('refresh_token', refreshtoken);
  }

  public loadToken() : void{
      this.token = localStorage.getItem("access_token");
  }

  public loadRefreshToken() : void{
    this.refreshtoken = localStorage.getItem("refresh_token");
}

  public getToken() : string{
    return this.token;
}

public getRefreshToken() : string{
  return this.refreshtoken;
}

  public addAgentRoleToLocalCache() : void{
      let payload = JSON.parse(atob(this.token.split('.')[1]));
      let roles = payload["roles"];
      let role: string = Array.isArray(roles) ? roles[0] : roles;
      if (role?.toUpperCase().startsWith('ROLE_')) {
          role = role.substring(5);
      }
      localStorage.setItem('role', role?.toUpperCase() ?? '');
  }

  public getAgentRoleFromLocalCache() : string{
    return localStorage.getItem('role');
  }

  public logOut(): void{
    this.token = null;
    this.loggedInUsername = null;
    localStorage.removeItem("agent");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
  }

  public isLoggedIn(): boolean {
    this.loadToken();
    if((this.token != null && this.token !== '') && ((this.jwtHelper.decodeToken(this.token).sub != null || '') && !this.jwtHelper.isTokenExpired(this.token))){
          this.loggedInUsername = this.jwtHelper.decodeToken(this.token).sub;
          return true;
    }else{

      this.logOut();
      return false;
    }
  }

}
