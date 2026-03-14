import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Emplacement } from 'src/shared/Emplacement';
import { TypeEmp } from 'src/app/enums/TypeEmp';

@Injectable({
  providedIn: 'root'
})
export class EmplacementService {

  public host = environment.baseUrl + "api/emplacements";

  constructor(private http: HttpClient) {}

  public createRoot(emplacement: Emplacement): Observable<Emplacement> {
    return this.http.post<Emplacement>(this.host, emplacement);
  }

  public createChild(parentId: string, emplacement: Emplacement): Observable<Emplacement> {
    return this.http.post<Emplacement>(`${this.host}/${parentId}/children`, emplacement);
  }

  public update(id: string, emplacement: Emplacement): Observable<Emplacement> {
    return this.http.put<Emplacement>(`${this.host}/${id}`, emplacement);
  }

  public getById(id: string): Observable<Emplacement> {
    return this.http.get<Emplacement>(`${this.host}/${id}`);
  }

  public getAll(): Observable<Emplacement[]> {
    return this.http.get<Emplacement[]>(this.host);
  }

  public getRoots(): Observable<Emplacement[]> {
    return this.http.get<Emplacement[]>(`${this.host}/roots`);
  }

  public getChildren(parentId: string): Observable<Emplacement[]> {
    return this.http.get<Emplacement[]>(`${this.host}/${parentId}/children`);
  }

  public delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.host}/${id}`);
  }

  public getByType(type: TypeEmp): Observable<Emplacement[]> {
    return this.http.get<Emplacement[]>(`${this.host}/type/${type}`);
  }

  public countByType(type: TypeEmp): Observable<number> {
    return this.http.get<number>(`${this.host}/type/${type}/count`);
  }

  public importExcel(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.host}/import`, formData, { responseType: 'text' });
  }

  // Télécharge le fichier Excel modèle.
  public downloadTemplate(): Observable<Blob> {
    return this.http.get(`${this.host}/template`, { responseType: 'blob' });
  }

  // Déplace un emplacement vers un nouveau parent.
  public updateParent(id: string, numero: string, type: TypeEmp, newParentId: string): Observable<Emplacement> {
    return this.http.put<Emplacement>(`${this.host}/${id}`, {
      id,
      numero,
      type,
      metrage: 0,
      parent: { id: newParentId }
    });
  }
}
