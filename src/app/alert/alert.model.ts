export type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'PAUSED';

export interface Alert {
  id: string;
  productUrl: string;
  productName: string | null;
  targetPrice: number;
  lastObservedPrice: number | null;
  status: AlertStatus;
  createdAt: string;
  lastCheckedAt: string | null;
}

export interface CreateAlertRequest {
  productUrl: string;
  productName?: string;
  targetPrice: number;
}
