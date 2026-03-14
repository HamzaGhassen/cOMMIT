import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Job } from 'src/shared/Job';
import { Pageable } from 'src/shared/Pageable';

@Injectable({
  providedIn: 'root'
})
export class JobService {

  public host = environment.baseUrl + "administration/jobs" ;

  constructor( private http : HttpClient) {}

  public getJobs(): Observable<Job[]>{
    return this.http.get<Job[]>(this.host);
  }

  public getJobsNumber(): Observable<number>{
    return this.http.get<number>(`${this.host}/count`);
  }

  public addJob(Job : Job):Observable<Job>{
    return this.http.post<Job>(this.host, Job);
  }

  public deleteJob(id : Number):Observable<Job>{
    return this.http.delete<Job>(`${this.host}/${id}`);
  }

  public getDataPaginated(pageableData: Pageable): Observable<Job[]> {
    if(pageableData.sort != undefined)
      return this.http.get<Job[]>(`${this.host}/pagination?page=${pageableData.page}&size=${pageableData.size}&sort=${pageableData.sort}`);
    else
      return this.http.get<Job[]>(`${this.host}/pagination?page=${pageableData.page}&size=${pageableData.size}`);
    }

  public search(filter : String,pageableData: Pageable): Observable<Job[]>{
    if(pageableData.sort != undefined)
      return this.http.get<Job[]>(`${this.host}/filter?page=${pageableData.page}&size=${pageableData.size}&search=${filter}&sort=${pageableData.sort}`);
    else
      return this.http.get<Job[]>(`${this.host}/filter?page=${pageableData.page}&size=${pageableData.size}&search=${filter}`);
    }
}
