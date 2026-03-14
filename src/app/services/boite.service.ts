import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Boite } from 'src/shared/Boite';

@Injectable({
  providedIn: 'root'
})
export class BoiteService {

  private host = environment.baseUrl + 'api/boites';

  constructor(private http: HttpClient) {}

  public getByEmplacement(emplacementId: string): Observable<Boite[]> {
    return this.http.get<Boite[]>(`${this.host}/emplacement/${emplacementId}`);
  }

  public create(emplacementId: string, boite: Partial<Boite>): Observable<Boite> {
    return this.http.post<Boite>(`${this.host}/emplacement/${emplacementId}`, boite);
  }

  public update(boiteId: string, boite: Partial<Boite>): Observable<Boite> {
    return this.http.put<Boite>(`${this.host}/${boiteId}`, boite);
  }

  public delete(boiteId: string): Observable<void> {
    return this.http.delete<void>(`${this.host}/${boiteId}`);
  }

  public deleteAllByEmplacement(emplacementId: string): Observable<void> {
    return this.http.delete<void>(`${this.host}/emplacement/${emplacementId}`);
  }
}
