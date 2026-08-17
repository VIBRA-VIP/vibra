import { api } from '@/services';

export type PayoutAccountInfo = {
  bankId: number;
  bankName: string;
  accountType: string;
  account: string;
  holder: string;
};

export type PayoutRequestDto = {
  id: string;
  creditsGross: number;
  feeCredits: number;
  netCredits: number;
  amountCop: number;
  feeRate: number;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'REJECTED' | 'CANCELLED';
  bankName: string;
  payoutAccountType: string;
  payoutAccount: string;
  payoutHolder: string;
  scheduledFor: string;
  paidAt: string | null;
  createdAt: string;
};

export type PayoutSummary = {
  balance: number;
  creditValueCop: number;
  feeRate: number;
  minCredits: number;
  hasPayoutAccount: boolean;
  payoutAccount: PayoutAccountInfo | null;
  previewFullBalance: {
    creditsGross: number;
    feeCredits: number;
    netCredits: number;
    feeRate: number;
    amountCop: number;
    feeCop: number;
  };
  pendingRequest: PayoutRequestDto | null;
};

export async function fetchPayoutSummary() {
  const { data } = await api.get<PayoutSummary>('/api/payouts/summary');
  return data;
}

export async function fetchPayoutHistory() {
  const { data } = await api.get<PayoutRequestDto[]>('/api/payouts');
  return data;
}

export async function createPayoutRequest(credits: number) {
  const { data } = await api.post<PayoutRequestDto>('/api/payouts', { credits });
  return data;
}
