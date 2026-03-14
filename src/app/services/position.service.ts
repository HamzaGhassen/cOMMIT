import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Pageable } from 'src/shared/Pageable';
import { Position } from 'src/shared/Position';

@Injectable({
  providedIn: 'root'
})
export class PositionService {

  public host = environment.baseUrl + "administration/positions" ;

  constructor( private http : HttpClient) {}

  public getPositions(): Observable<Position[]>{
    return this.http.get<Position[]>(this.host);
  }

  public getPositionsNumber(): Observable<number>{
    return this.http.get<number>(`${this.host}/count`);
  }

  public getPositionsTree(): Observable<Position[]>{
    return this.http.get<Position[]>(environment.baseUrl + "positionstree");
  }

  public addPosition(position : Position):Observable<Position>{
    return this.http.post<Position>(this.host, position);
  }

  public deletePosition(id : Number):Observable<Position>{
    return this.http.delete<Position>(`${this.host}/${id}`);
  }

  public getDataPaginated(pageableData: Pageable): Observable<Position[]> {
    if(pageableData.sort != undefined)
      return this.http.get<Position[]>(`${this.host}/pagination?page=${pageableData.page}&size=${pageableData.size}&sort=${pageableData.sort}`);
    else
      return this.http.get<Position[]>(`${this.host}/pagination?page=${pageableData.page}&size=${pageableData.size}`);
    }

  public search(filter : String,pageableData: Pageable): Observable<Position[]>{
    if(pageableData.sort != undefined)
      return this.http.get<Position[]>(`${this.host}/filter?page=${pageableData.page}&size=${pageableData.size}&search=${filter}&sort=${pageableData.sort}`);
    else
      return this.http.get<Position[]>(`${this.host}/filter?page=${pageableData.page}&size=${pageableData.size}&search=${filter}`);
    }
}
