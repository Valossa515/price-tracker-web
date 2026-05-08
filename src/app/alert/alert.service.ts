import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Alert, CreateAlertRequest } from './alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/alerts`;

  list(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.base);
  }

  create(req: CreateAlertRequest): Observable<Alert> {
    return this.http.post<Alert>(this.base, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  triggerCheck(): Observable<{ processed: number }> {
    return this.http.post<{ processed: number }>(`${this.base}/check-now`, {});
  }
}
