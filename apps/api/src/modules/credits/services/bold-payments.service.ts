import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../config/env.schema';

const BOLD_LINK_BASE = 'https://integrations.api.bold.co/online/link/v1';

type BoldCreateLinkResponse = {
  payload?: {
    payment_link?: string;
    url?: string;
  };
  errors?: Array<{ message?: string } | string>;
};

type BoldLinkStatusResponse = {
  id?: string;
  status?: string;
  reference?: string;
  transaction_id?: string | null;
  total?: number;
  is_sandbox?: boolean;
  errors?: Array<{ message?: string } | string>;
  payload?: BoldLinkStatusResponse;
};

@Injectable()
export class BoldPaymentsService {
  private readonly logger = new Logger(BoldPaymentsService.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  isConfigured(): boolean {
    return Boolean(this.config.get('BOLD_API_KEY', { infer: true }));
  }

  private apiKey(): string {
    const key = this.config.get('BOLD_API_KEY', { infer: true });
    if (!key) {
      throw new ServiceUnavailableException(
        'Pagos con Bold no están configurados. Configura BOLD_API_KEY en el servidor.',
      );
    }
    return key;
  }

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `x-api-key ${this.apiKey()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  /** Split COP total into VAT base + value so total = base + vat. */
  splitVat(totalCop: number): { base: number; value: number } {
    const total = Math.round(totalCop);
    const base = Math.round(total / 1.19);
    return { base, value: total - base };
  }

  async createPaymentLink(input: {
    amountCop: number;
    reference: string;
    description: string;
    callbackUrl?: string;
    payerEmail?: string;
  }): Promise<{ paymentLink: string; url: string }> {
    const { base, value } = this.splitVat(input.amountCop);
    const body: Record<string, unknown> = {
      amount_type: 'CLOSE',
      amount: {
        currency: 'COP',
        total_amount: Math.round(input.amountCop),
        tip_amount: 0,
        taxes: [{ type: 'VAT', base, value }],
      },
      reference: input.reference.slice(0, 60),
      description: input.description.slice(0, 100),
      payment_methods: ['CREDIT_CARD', 'PSE', 'NEQUI', 'BOTON_BANCOLOMBIA'],
    };

    if (input.callbackUrl?.startsWith('https://')) {
      body.callback_url = input.callbackUrl;
    }
    if (input.payerEmail) {
      body.payer_email = input.payerEmail;
    }

    // Expire in 2 hours (Bold expects nanoseconds since epoch).
    body.expiration_date = Date.now() * 1e6 + 2 * 60 * 60 * 1e9;

    const res = await fetch(BOLD_LINK_BASE, {
      method: 'POST',
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });

    const json = (await res.json().catch(() => ({}))) as BoldCreateLinkResponse;
    if (!res.ok) {
      const msg = this.formatErrors(json.errors) || `Bold HTTP ${res.status}`;
      this.logger.error(`Bold create link failed: ${msg}`);
      throw new BadRequestException(`No se pudo crear el link de pago: ${msg}`);
    }

    const paymentLink = json.payload?.payment_link;
    const url = json.payload?.url;
    if (!paymentLink || !url) {
      throw new BadRequestException('Bold no devolvió un link de pago válido');
    }

    return { paymentLink, url };
  }

  async getLinkStatus(paymentLink: string): Promise<{
    status: string;
    reference?: string;
    transactionId?: string | null;
    total?: number;
  }> {
    const res = await fetch(`${BOLD_LINK_BASE}/${encodeURIComponent(paymentLink)}`, {
      method: 'GET',
      headers: this.authHeaders(),
    });

    const json = (await res.json().catch(() => ({}))) as BoldLinkStatusResponse;
    if (!res.ok) {
      const msg = this.formatErrors(json.errors) || `Bold HTTP ${res.status}`;
      this.logger.warn(`Bold get link failed: ${msg}`);
      throw new BadRequestException(`No se pudo consultar el pago: ${msg}`);
    }

    const data = json.payload ?? json;
    return {
      status: String(data.status ?? 'UNKNOWN').toUpperCase(),
      reference: data.reference ?? undefined,
      transactionId: data.transaction_id ?? null,
      total: data.total,
    };
  }

  private formatErrors(errors: BoldCreateLinkResponse['errors']): string {
    if (!errors?.length) return '';
    return errors
      .map((e) => (typeof e === 'string' ? e : e.message ?? JSON.stringify(e)))
      .join('; ');
  }
}
