import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from '../../environments/environment';

export const authConfig: AuthConfig = {
  issuer: environment.cognito.issuer,
  clientId: environment.cognito.clientId,
  redirectUri: environment.cognito.redirectUri,
  responseType: 'code',
  scope: environment.cognito.scope,
  showDebugInformation: false,
  oidc: true,
  // Cognito uses HTTPS for the issuer; localhost redirect is fine.
  requireHttps: true,
  strictDiscoveryDocumentValidation: false,
};
