export interface ApiResponse<T> {
  success: boolean;
  message: string;
  status_code?: number;
  data: T;
}

// ─── Country ─────────────────────────────────────────────────────────────────

export interface Country {
  name: string;
  code: string;
  dial_code: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginData {
  otp: string;
  email?: string;
  phone: string;
  token: string;
}

// ─── Error ────────────────────────────────────────────────────────────────────

export interface ErrorData {
  field: string;
}

export interface ErrorResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: ErrorData;
}

// ─── Crypto Market ────────────────────────────────────────────────────────────

export interface CryptoMarketItem {
  id: string;
  name?: string;
  symbol: string;
  image?: string;
  price_idr: number;
  change_percent: number;
  isPositive: boolean;
  hot: boolean;
  isFavorite: boolean;
  type: string;
}
