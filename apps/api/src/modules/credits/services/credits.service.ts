import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreditPurchaseStatus } from '@prisma/client';
import { CREDIT_PACKAGES, getCreditPackage } from '@vibra/types';
import { CREDIT_VALUE_COP, creditsToCop } from '@vibra/shared';
import type { Env } from '../../../config/env.schema';
import { PrismaService } from '../../../database/prisma.service';
import { BoldPaymentsService } from './bold-payments.service';

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bold: BoldPaymentsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  listPackages() {
    return {
      creditValueCop: CREDIT_VALUE_COP,
      packages: CREDIT_PACKAGES.map((p) => ({
        id: p.id,
        credits: p.credits,
        label: p.label,
        amountCop: creditsToCop(p.credits),
      })),
      paymentsEnabled: this.bold.isConfigured(),
    };
  }

  async createPurchase(userId: string, packageId: string, payerEmail?: string) {
    const pack = getCreditPackage(packageId);
    if (!pack) {
      throw new BadRequestException('Paquete de créditos inválido');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, wallet: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role !== 'CLIENT') {
      throw new ForbiddenException('Solo los clientes pueden comprar créditos');
    }

    if (!user.wallet) {
      await this.prisma.wallet.create({ data: { userId } });
    }

    const amountCop = creditsToCop(pack.credits);
    const purchaseId = crypto.randomUUID();
    const reference = `vibra_${purchaseId.replace(/-/g, '').slice(0, 24)}_${Date.now()}`
      .slice(0, 60);

    const webUrl = this.firstWebUrl();
    const callbackUrl = webUrl
      ? `${webUrl.replace(/\/$/, '')}/credits?purchase=${purchaseId}`
      : undefined;

    const { paymentLink, url } = await this.bold.createPaymentLink({
      amountCop,
      reference,
      description: `Vibra · ${pack.credits} créditos`,
      callbackUrl,
      payerEmail: payerEmail ?? user.email,
    });

    const purchase = await this.prisma.creditPurchase.create({
      data: {
        id: purchaseId,
        userId,
        packageId: pack.id,
        credits: pack.credits,
        amountCop,
        status: CreditPurchaseStatus.PENDING,
        reference,
        boldPaymentLink: paymentLink,
        boldPaymentUrl: url,
      },
    });

    return {
      purchaseId: purchase.id,
      packageId: purchase.packageId,
      credits: purchase.credits,
      amountCop: purchase.amountCop,
      status: purchase.status,
      paymentUrl: url,
      paymentLink,
    };
  }

  async getPurchase(userId: string, purchaseId: string) {
    const purchase = await this.prisma.creditPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase || purchase.userId !== userId) {
      throw new NotFoundException('Compra no encontrada');
    }
    return this.serializePurchase(purchase);
  }

  async syncPurchase(userId: string, purchaseId: string) {
    const purchase = await this.prisma.creditPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase || purchase.userId !== userId) {
      throw new NotFoundException('Compra no encontrada');
    }

    if (purchase.status === CreditPurchaseStatus.PAID) {
      return this.serializePurchase(purchase);
    }

    if (!purchase.boldPaymentLink) {
      throw new BadRequestException('Esta compra no tiene link de Bold');
    }

    const link = await this.bold.getLinkStatus(purchase.boldPaymentLink);
    return this.applyBoldStatus(purchase.id, link, null);
  }

  async handleBoldWebhook(body: Record<string, unknown>) {
    const type = String(body.type ?? '').toUpperCase();
    const eventId = typeof body.id === 'string' ? body.id : null;
    const data =
      body.data && typeof body.data === 'object'
        ? (body.data as Record<string, unknown>)
        : body;

    const reference = this.pickString(data, [
      'reference',
      'payment_reference',
      'merchant_reference',
      'external_reference',
    ]);
    const paymentLink = this.pickString(data, [
      'payment_link',
      'paymentLink',
      'link_id',
      'linkId',
    ]);
    const transactionId =
      this.pickString(data, ['transaction_id', 'transactionId', 'bold_transaction_id']) ??
      (typeof body.subject === 'string' ? body.subject : null);

    let purchase =
      (reference
        ? await this.prisma.creditPurchase.findUnique({ where: { reference } })
        : null) ??
      (paymentLink
        ? await this.prisma.creditPurchase.findFirst({
            where: { boldPaymentLink: paymentLink },
          })
        : null);

    if (!purchase && paymentLink) {
      // ignore
    }

    if (!purchase) {
      this.logger.warn(
        `Bold webhook sin compra coincidente type=${type} ref=${reference} link=${paymentLink}`,
      );
      return { ok: true, matched: false };
    }

    if (eventId) {
      const already = await this.prisma.creditPurchase.findFirst({
        where: { webhookEventId: eventId },
      });
      if (already) {
        return { ok: true, matched: true, duplicate: true };
      }
    }

    if (type === 'SALE_APPROVED' || type === 'PAYMENT_APPROVED') {
      if (purchase.boldPaymentLink) {
        try {
          const link = await this.bold.getLinkStatus(purchase.boldPaymentLink);
          await this.applyBoldStatus(purchase.id, link, eventId);
          return { ok: true, matched: true };
        } catch (err) {
          this.logger.warn(
            `Webhook: no se pudo verificar link, acreditando por SALE_APPROVED: ${String(err)}`,
          );
        }
      }
      await this.fulfillPurchase(purchase.id, {
        transactionId,
        webhookEventId: eventId,
      });
      return { ok: true, matched: true };
    }

    if (type === 'SALE_REJECTED') {
      await this.prisma.creditPurchase.updateMany({
        where: { id: purchase.id, status: CreditPurchaseStatus.PENDING },
        data: {
          status: CreditPurchaseStatus.FAILED,
          boldTransactionId: transactionId ?? undefined,
          webhookEventId: eventId ?? undefined,
        },
      });
      return { ok: true, matched: true };
    }

    // For other events, try to sync from Bold if we have a link id.
    if (purchase.boldPaymentLink) {
      try {
        const link = await this.bold.getLinkStatus(purchase.boldPaymentLink);
        await this.applyBoldStatus(purchase.id, link, eventId);
      } catch {
        // ignore transient Bold errors on webhook
      }
    }

    return { ok: true, matched: true };
  }

  private async applyBoldStatus(
    purchaseId: string,
    link: {
      status: string;
      reference?: string;
      transactionId?: string | null;
      total?: number;
    },
    webhookEventId: string | null,
  ) {
    const status = link.status.toUpperCase();

    if (status === 'PAID') {
      return this.fulfillPurchase(purchaseId, {
        transactionId: link.transactionId ?? null,
        webhookEventId,
      });
    }

    const mapped =
      status === 'EXPIRED'
        ? CreditPurchaseStatus.EXPIRED
        : status === 'CANCELLED' || status === 'REJECTED'
          ? status === 'REJECTED'
            ? CreditPurchaseStatus.FAILED
            : CreditPurchaseStatus.CANCELLED
          : null;

    if (mapped) {
      await this.prisma.creditPurchase.updateMany({
        where: { id: purchaseId, status: CreditPurchaseStatus.PENDING },
        data: {
          status: mapped,
          boldTransactionId: link.transactionId ?? undefined,
          webhookEventId: webhookEventId ?? undefined,
        },
      });
    }

    const purchase = await this.prisma.creditPurchase.findUniqueOrThrow({
      where: { id: purchaseId },
    });
    return this.serializePurchase(purchase);
  }

  private async fulfillPurchase(
    purchaseId: string,
    opts: { transactionId?: string | null; webhookEventId?: string | null },
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const purchase = await tx.creditPurchase.findUnique({
        where: { id: purchaseId },
      });
      if (!purchase) throw new NotFoundException('Compra no encontrada');
      if (purchase.status === CreditPurchaseStatus.PAID) {
        return purchase;
      }
      if (purchase.status !== CreditPurchaseStatus.PENDING) {
        throw new BadRequestException(`Compra en estado ${purchase.status}`);
      }

      let wallet = await tx.wallet.findUnique({ where: { userId: purchase.userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId: purchase.userId } });
      }

      const balanceAfter = wallet.balance + purchase.credits;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          userId: purchase.userId,
          type: 'PURCHASE',
          amount: purchase.credits,
          balanceAfter,
          description: `Compra ${purchase.packageId} (${purchase.credits} créditos)`,
          referenceId: purchase.id,
        },
      });

      return tx.creditPurchase.update({
        where: { id: purchase.id },
        data: {
          status: CreditPurchaseStatus.PAID,
          paidAt: new Date(),
          boldTransactionId: opts.transactionId ?? purchase.boldTransactionId,
          webhookEventId: opts.webhookEventId ?? purchase.webhookEventId,
        },
      });
    });

    this.logger.log(
      `Compra ${result.id} acreditada: +${result.credits} créditos a user ${result.userId}`,
    );
    return this.serializePurchase(result);
  }

  private serializePurchase(purchase: {
    id: string;
    packageId: string;
    credits: number;
    amountCop: number;
    status: CreditPurchaseStatus;
    boldPaymentUrl: string | null;
    boldPaymentLink: string | null;
    paidAt: Date | null;
    createdAt: Date;
  }) {
    return {
      purchaseId: purchase.id,
      packageId: purchase.packageId,
      credits: purchase.credits,
      amountCop: purchase.amountCop,
      status: purchase.status,
      paymentUrl: purchase.boldPaymentUrl,
      paymentLink: purchase.boldPaymentLink,
      paidAt: purchase.paidAt,
      createdAt: purchase.createdAt,
    };
  }

  private firstWebUrl(): string | undefined {
    const raw = this.config.get('WEB_URL', { infer: true });
    const first = raw
      .split(',')
      .map((v) => v.trim())
      .find((v) => v && v !== '*');
    return first;
  }

  private pickString(obj: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const v = obj[key];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    // Nested metadata / amount objects sometimes hold reference
    const meta = obj.metadata;
    if (meta && typeof meta === 'object') {
      const m = meta as Record<string, unknown>;
      for (const key of keys) {
        const v = m[key];
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
    }
    return null;
  }
}
