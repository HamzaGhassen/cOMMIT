import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RegleConservation, RegleConservationWithDetails, DecisionFinale } from 'src/shared/regle-conservation';
import { TypeDocument } from 'src/shared/type-document';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegleConservationService {

  public host = environment.baseUrl + "administration/regles-conservation";

  constructor(private http: HttpClient) { }

  // Get all rules
  public getRegles(): Observable<RegleConservation[]> {
    return this.http.get<RegleConservation[]>(this.host);
  }

  // Get rules with details for display
  public getReglesWithDetails(): Observable<RegleConservationWithDetails[]> {
    return this.http.get<RegleConservation[]>(this.host).pipe(
      map(regles => regles.map(regle => this.enrichRegleWithDetails(regle)))
    );
  }

  // Get single rule by ID
  public getRegleById(id: number): Observable<RegleConservationWithDetails> {
    return this.http.get<RegleConservation>(`${this.host}/${id}`).pipe(
      map(regle => this.enrichRegleWithDetails(regle))
    );
  }

  // Create new rule
  public createRegle(regle: RegleConservation): Observable<RegleConservation> {
    return this.http.post<RegleConservation>(this.host, regle);
  }

  // Update rule
  public updateRegle(id: number, regle: RegleConservation): Observable<RegleConservation> {
    return this.http.put<RegleConservation>(`${this.host}/${id}`, regle);
  }

  // Delete rule
  public deleteRegle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.host}/${id}`);
  }

  // Invalidate rule
  public invalidateRegle(id: number): Observable<RegleConservation> {
    return this.http.put<RegleConservation>(`${this.host}/${id}/invalidate`, {});
  }

  // Get types document
  public getTypesDocument(): Observable<TypeDocument[]> {
    const typeDocsUrl = environment.baseUrl + "administration/type-documents";
    return this.http.get<TypeDocument[]>(typeDocsUrl);
  }

  // Save new type document
  public saveTypeDocument(typeDocument: TypeDocument): Observable<TypeDocument> {
    const typeDocsUrl = environment.baseUrl + "administration/type-documents";
    return this.http.post<TypeDocument>(typeDocsUrl, typeDocument);
  }

  // Get rules by type document
  public getReglesByTypeDocument(typeDocumentId: number): Observable<RegleConservation[]> {
    return this.http.get<RegleConservation[]>(`${this.host}/by-type/${typeDocumentId}`);
  }

  // Get rules by decision
  public getReglesByDecision(decision: string): Observable<RegleConservation[]> {
    return this.http.get<RegleConservation[]>(`${this.host}/by-decision?decision=${decision}`);
  }

  // Helper method to enrich rule with calculated fields
  private enrichRegleWithDetails(regle: RegleConservation): RegleConservationWithDetails {
    return {
      ...regle,
      typeDocumentTitre: regle.typeDocument?.title || 'Non défini', // Changed from titre to title
      dureeTotale: this.calculerDureeTotale(regle),
      statut: this.determinerStatut(regle)
    };
  }

  private calculerDureeTotale(regle: RegleConservation): string {
    if (regle.infini) {
      return 'Illimitée';
    }
    const totale = (regle.actif || 0) + (regle.semi_actif || 0);
    if (totale === 0) return 'Non définie';
    if (totale === 1) return '1 an';
    return `${totale} ans`;
  }

  private determinerStatut(regle: RegleConservation): 'Actif' | 'Inactif' {
    return regle.estValide ? 'Actif' : 'Inactif';
  }
}