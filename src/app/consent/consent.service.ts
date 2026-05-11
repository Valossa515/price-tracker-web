import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AcceptConsentRequest,
  AcceptConsentResponse,
  PendingConsent,
} from './consent.model';

@Injectable({ providedIn: 'root' })
export class ConsentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/consents`;

  required(): Observable<PendingConsent[]> {
    return this.http.get<PendingConsent[]>(`${this.base}/required`);
  }

  async getRequired(): Promise<PendingConsent[]> {
    return firstValueFrom(this.required());
  }

  accept(req: AcceptConsentRequest): Observable<AcceptConsentResponse> {
    return this.http.post<AcceptConsentResponse>(`${this.base}/accept`, req);
  }
}
