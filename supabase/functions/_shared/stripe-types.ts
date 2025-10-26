// Core Stripe Connect Express Types
export interface StripeAccountLinkRequest {
  companyId: string;
  returnUrl: string;
}

export interface StripeAccountLinkResponse {
  url: string;
  expires_at: number;
}
