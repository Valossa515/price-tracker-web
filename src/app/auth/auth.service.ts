import { inject, Injectable, signal } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { authConfig } from './auth.config';
import { environment } from '../../environments/environment';

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
    // Cognito logout endpoint exige os params proprietários `client_id` e `logout_uri`,
    // que o angular-oauth2-oidc não envia (manda id_token_hint + post_logout_redirect_uri).
    // Limpamos a sessão local e redirecionamos manualmente para a URL correta do Cognito.
    this.oauth.logOut(true); // true = no redirect, só limpa storage
    const logoutUri = encodeURIComponent(window.location.origin + '/logout');
    const url = `https://${environment.cognito.domain}/logout`
      + `?client_id=${environment.cognito.clientId}`
      + `&logout_uri=${logoutUri}`;
    window.location.assign(url);
  }

  getIdToken(): string | null {
    return this.oauth.getIdToken() || null;
  }
}
