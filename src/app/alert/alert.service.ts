import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Alert,
  AlertAnalytics,
  CreateAlertRequest,
  PriceHistoryPoint,
  ProductComparison,
} from './alert.model';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/alerts`;

  list(): Observable<Alert[]> {
    return this.http.get<Alert[]>(this.base);
  }

  get(id: string): Observable<Alert> {
    return this.http.get<Alert>(`${this.base}/${id}`);
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

  history(id: string, days = 30, limit = 500): Observable<PriceHistoryPoint[]> {
    const params = new HttpParams()
      .set('days', days)
      .set('limit', limit);
    return this.http.get<PriceHistoryPoint[]>(`${this.base}/${id}/history`, { params });
  }

  analytics(id: string, days = 30): Observable<AlertAnalytics> {
    const params = new HttpParams().set('days', days);
    return this.http.get<AlertAnalytics>(`${this.base}/${id}/analytics`, { params });
  }

  comparisons(id: string, minScore = 0.55, limit = 5): Observable<ProductComparison[]> {
    const params = new HttpParams()
      .set('minScore', minScore)
      .set('limit', limit);
    return this.http.get<ProductComparison[]>(`${this.base}/${id}/comparisons`, { params });
  }
}
