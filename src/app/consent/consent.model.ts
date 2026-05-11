export type ConsentDocumentType = 'PRIVACY_POLICY' | 'TERMS_OF_USE';

export interface PendingConsent {
  documentType: ConsentDocumentType;
  version: string;
  title: string;
  url: string;
}

export interface AcceptConsentRequest {
  documentType: ConsentDocumentType;
  version: string;
}

export interface AcceptConsentResponse {
  id: string;
  documentType: ConsentDocumentType;
  version: string;
  acceptedAt: string;
}
