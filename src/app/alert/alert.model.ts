export type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'PAUSED';

export type AlertType =
  | 'PRICE_BELOW_TARGET'
  | 'PERCENT_DISCOUNT'
  | 'PRICE_DROP'
  | 'BACK_IN_STOCK';

export interface Alert {
  id: string;
  productUrl: string;
  productName: string | null;
  alertType: AlertType;
  targetPrice: number | null;
  discountPercent: number | null;
  dropWindowDays: number | null;
  dropPercent: number | null;
  lastObservedPrice: number | null;
  lastObservedAvailable: boolean | null;
  realDiscountFlag: boolean | null;
  status: AlertStatus;
  createdAt: string;
  lastCheckedAt: string | null;
}

export interface CreateAlertRequest {
  productUrl: string;
  productName?: string;
  alertType?: AlertType;
  targetPrice?: number | null;
  discountPercent?: number | null;
  dropWindowDays?: number | null;
  dropPercent?: number | null;
}

export interface PriceHistoryPoint {
  price: number;
  observedAt: string;
}

export type Trend = 'UP' | 'DOWN' | 'STABLE' | 'UNKNOWN';

export interface AlertAnalytics {
  periodDays: number;
  samples: number;
  currentPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  avgPrice: number | null;
  lowestEverPrice: number | null;
  isLowestInPeriod: boolean;
  isRealDiscount: boolean;
  trend: Trend;
}

export interface ProductComparison {
  marketplace: string;
  name: string;
  price: number | null;
  url: string;
  matchScore: number;
  priceDiff: number | null;
  priceDiffPercent: number | null;
}

export const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  PRICE_BELOW_TARGET: 'Preço abaixo do alvo',
  PERCENT_DISCOUNT: '% de desconto vs média 30d',
  PRICE_DROP: 'Queda de preço em N dias',
  BACK_IN_STOCK: 'Voltou ao estoque',
};
