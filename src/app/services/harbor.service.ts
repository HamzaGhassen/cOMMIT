import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Harbor } from 'src/shared/Harbor';
import { Pageable } from 'src/shared/Pageable';

@Injectable({
  providedIn: 'root'
})
export class HarborService {

  public host = environment.baseUrl + "administration/harbors" ;

  constructor( private http : HttpClient) {}

  public getHarbors(): Observable<Harbor[]>{
    return this.http.get<Harbor[]>(this.host);
  }

  public getHarborsNumber(): Observable<number>{
    return this.http.get<number>(`${this.host}/count`);
  }

  public addHarbor(harbor : Harbor):Observable<Harbor>{
    return this.http.post<Harbor>(this.host, harbor);
  }

  public deleteHarbor(id : Number):Observable<Harbor>{
    return this.http.delete<Harbor>(`${this.host}/${id}`);
  }

  public getDataPaginated(pageableData: Pageable): Observable<Harbor[]> {
    if(pageableData.sort != undefined)
      return this.http.get<Harbor[]>(`${this.host}/pagination?page=${pageableData.page}&size=${pageableData.size}&sort=${pageableData.sort}`);
    else
      return this.http.get<Harbor[]>(`${this.host}/pagination?page=${pageableData.page}&size=${pageableData.size}`);
    }

  public search(filter : String,pageableData: Pageable): Observable<Harbor[]>{
    if(pageableData.sort != undefined)
      return this.http.get<Harbor[]>(`${this.host}/filter?page=${pageableData.page}&size=${pageableData.size}&search=${filter}&sort=${pageableData.sort}`);
    else
      return this.http.get<Harbor[]>(`${this.host}/filter?page=${pageableData.page}&size=${pageableData.size}&search=${filter}`);
    }
}

