import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Pageable } from 'src/shared/Pageable';
import { Agent } from 'src/shared/Agent';

@Injectable({
  providedIn: 'root'
})
export class AgentService {

  public host = environment.baseUrl + "administration/agents";

  constructor(private http: HttpClient) { }

  public getAgents(): Observable<Agent[]> {
    return this.http.get<Agent[]>(this.host);
  }

  public getAgentsNumber(): Observable<number> {
    return this.http.get<number>(`${this.host}/count`);
  }

  public CheckBlocked(): Observable<Boolean> {
    return this.http.get<Boolean>(`${this.host}/checkBlocked`);
  }

  public getDirector(): Observable<Agent> {
    return this.http.get<Agent>(`${this.host}/director`);
  }

  public getAgentById(id: number): Observable<Agent> {
    return this.http.get<Agent>(`${this.host}/${id}`);
  }

  public getAgentByAgentname(username: String): Observable<Agent> {
    return this.http.get<Agent>(`${this.host}/getByAgentname/${username}`);
  }

  public getAgentByAutocomplete(filter: String): Observable<Agent[]> {
    return this.http.get<Agent[]>(`${this.host}/getAutocomplete/${filter}`);
  }

  public addAgent(user: Agent): Observable<Agent> {
    return this.http.post<Agent>(this.host, user);
  }

  public deleteAgent(id: Number): Observable<Agent> {
    return this.http.delete<Agent>(`${this.host}/${id}`);
  }

  public getAgentByToken(): Observable<Agent> {
    return this.http.get<Agent>(`${this.host}/profile`);
  }

  public getAgentByRegNum(regNum: String): Observable<Agent> {
    return this.http.get<Agent>(`${this.host}/regNumber/${regNum}`);
  }

  public getDataPaginated(pageableData: Pageable): Observable<Agent[]> {
    if (pageableData.sort != undefined)
      return this.http.get<Agent[]>(`${this.host}/pagination?page=${pageableData.page}&size=${pageableData.size}&sort=${pageableData.sort}`);
    else
      return this.http.get<Agent[]>(`${this.host}/pagination?page=${pageableData.page}&size=${pageableData.size}`);
  }

  public search(filter: String, pageableData: Pageable): Observable<Agent[]> {
    if (pageableData.sort != undefined)
      return this.http.get<Agent[]>(`${this.host}/filter?page=${pageableData.page}&size=${pageableData.size}&search=${filter}&sort=${pageableData.sort}`);
    else
      return this.http.get<Agent[]>(`${this.host}/filter?page=${pageableData.page}&size=${pageableData.size}&search=${filter}`);
  }

  public getAgentsSearch(pageableData: Pageable, matricule: string): Observable<Agent[] | HttpResponse<any>> {
    let url: string;
    url = `${this.host}/search/pageable?page=${pageableData.page}&size=${pageableData.size}`;
    if (pageableData.sort != undefined)
      url += `&sort=${pageableData.sort}`;
    if (matricule != null)
      url += `&matricule=${matricule}`;

    return this.http.get<Agent[]>(url);

  }

  public resetPassword(password: String): Observable<any> {
    return this.http.post(`${this.host}/resetPassword?password=${password}`, null, { responseType: 'text' });
  }

  public updateProfile(agent: Agent): Observable<Agent> {
    return this.http.put<Agent>(`${this.host}/profile/update`, agent);
  }


  public getAffectation(users: Agent[]): Observable<Agent[]> {
    return this.http.post<Agent[]>(`${this.host}/getAffectation`, users);
  }


  public getAgentByUsername(username: String): Observable<Agent> {
    return this.http.get<Agent>(`${this.host}/getByUsername/${username}`);
  }

}
