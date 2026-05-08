import { inject, Injectable, signal } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './auth.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oauth = inject(OAuthService);
  readonly authenticated = signal(false);
  readonly userEmail = signal<string | null>(null);

  async init(): Promise<void> {
    this.oauth.configure(authConfig);
    await this.oauth.loadDiscoveryDocumentAndTryLogin();
    this.refresh();
    this.oauth.events.subscribe(() => this.refresh());
  }

  private refresh(): void {
    const valid = this.oauth.hasValidIdToken() && this.oauth.hasValidAccessToken();
    this.authenticated.set(valid);
    const claims = this.oauth.getIdentityClaims() as { email?: string } | null;
    this.userEmail.set(claims?.email ?? null);
  }

  login(): void {
    this.oauth.initCodeFlow();
  }

  logout(): void {
    this.oauth.logOut();
  }

  getIdToken(): string | null {
    return this.oauth.getIdToken() || null;
  }
}
