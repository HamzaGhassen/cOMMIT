import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpClient,
  HttpResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthenticationService } from './authenticationService';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  refresh = false;
  public refreshhost = environment.baseUrl + "login/auth/refresh-token";

  constructor(private authenticationService: AuthenticationService, private router: Router, private http: HttpClient) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    //for login
    if (request.url.includes(`${this.authenticationService.host}`)) {
      return next.handle(request);
    }

    //for requesting refresh token
    if (request.url.includes(`${this.authenticationService.refreshhost}`)) {
      this.authenticationService.loadRefreshToken();
      const refreshtoken = this.authenticationService.getRefreshToken();
      const tokenizedReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${refreshtoken}`
        }

      })
      return next.handle(tokenizedReq);
    }

    this.authenticationService.loadToken();
    const token = this.authenticationService.getToken();

    const tokenizedReq = request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }

    })

    /* console.log('--------------------tokenizedReq.headers-----------------------');
    console.log('Modified Request Headers:', tokenizedReq.headers);
    console.log('--------------------tokenizedReq.headers.get(key)-----------------------');
    tokenizedReq.headers.keys().forEach(key => {
      console.log(`${key}: ${tokenizedReq.headers.get(key)}`);
    }); */

    return next.handle(tokenizedReq).pipe(catchError((err: HttpErrorResponse) => {
      const errorBody = err.error;
      const errorField = errorBody ? errorBody["error"] : null;
      const messageField = errorBody ? errorBody["message"] : null;

      if (errorField == "Unauthorized" || errorField == "token expired" || errorField == "Session expired due to inactivity.") {
        this.authenticationService.expiredMsg = "La session a expiré. Reconnectez-vous."
        this.router.navigateByUrl(`/login`);
      }
      else if (!this.refresh && messageField == "No message available") {
        this.refresh = true;
        return this.http.post<HttpResponse<any> | HttpErrorResponse | any>(`${this.refreshhost}`, { observe: 'response' }).pipe(
          switchMap((response: any) => {
            const token = response["access_token"];
            localStorage.removeItem("access_token")
            this.authenticationService.saveToken(token);
            this.refresh = false;
            return next.handle(request.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            }))
          }), catchError(
            err => {
              this.authenticationService.expiredMsg = "La session a expiré. Reconnectez-vous."
              this.router.navigateByUrl(`/login`);
              return throwError(() => err)
            }
          )
        )
      }
      else if (err.status === 403) {
        // Only redirect to /access for page navigation, not API calls
        if (!request.url.includes('/api/') && !request.url.includes('/administration/')) {
          this.router.navigateByUrl(`/access`);
        }
      }
      else if (err.status === 405) {
        alert("Entrée Incorrecte")
      }
      else if (err.status === 415) {
        alert("415 - type de média non supporté")
      }
      else if (err.status === 404) {
        alert("404 - element n'existe pas ")
      }
      else if (err.status === 413) {
        alert("413 - fichier trop volumineux ")
      }
      else if (err.status === 500) {
        alert("500 - Erreur interne du serveur ")
      }
      else if (err.status === 503) {
        alert("503 - Service indisponible ")
      }

      return throwError(() => err)
    }));
  }
}
