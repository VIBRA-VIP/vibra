import { api } from '@/services';

export type CreditPackage = {
  id: string;
  credits: number;
  label: string;
  amountCop: number;
};

export type CreditPackagesResponse = {
  creditValueCop: number;
  packages: CreditPackage[];
  paymentsEnabled: boolean;
};

export type CreditPurchase = {
  purchaseId: string;
  packageId: string;
  credits: number;
  amountCop: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  paymentUrl: string | null;
  paymentLink: string | null;
  paidAt?: string | null;
  createdAt?: string;
};

export async function listCreditPackages() {
  const { data } = await api.get<CreditPackagesResponse>('/api/credits/packages');
  return data;
}

export async function createCreditPurchase(packageId: string) {
  const { data } = await api.post<CreditPurchase>('/api/credits/purchases', { packageId });
  return data;
}

export async function getCreditPurchase(purchaseId: string) {
  const { data } = await api.get<CreditPurchase>(`/api/credits/purchases/${purchaseId}`);
  return data;
}

export async function syncCreditPurchase(purchaseId: string) {
  const { data } = await api.post<CreditPurchase>(`/api/credits/purchases/${purchaseId}/sync`);
  return data;
}
