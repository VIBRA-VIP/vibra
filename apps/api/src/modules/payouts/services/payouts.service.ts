import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PayoutRequestStatus, UserRole } from '@prisma/client';
import {
  calcPayoutBreakdown,
  CREDIT_VALUE_COP,
  getPayoutOptionName,
  MIN_PAYOUT_CREDITS,
  PLATFORM_PAYOUT_FEE_RATE,
} from '@vibra/shared';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PayoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string) {
    const user = await this.requireModel(userId);
    const balance = user.wallet?.balance ?? 0;
    const breakdown = calcPayoutBreakdown(balance);
    const hasPayoutAccount = Boolean(
      user.profile?.payoutBankId &&
        user.profile?.payoutAccountType &&
        user.profile?.payoutAccount &&
        user.profile?.payoutHolder,
    );
    const pending = await this.prisma.payoutRequest.findFirst({
      where: {
        userId,
        status: { in: [PayoutRequestStatus.PENDING, PayoutRequestStatus.PROCESSING] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      balance,
      creditValueCop: CREDIT_VALUE_COP,
      feeRate: PLATFORM_PAYOUT_FEE_RATE,
      minCredits: MIN_PAYOUT_CREDITS,
      hasPayoutAccount,
      payoutAccount: hasPayoutAccount
        ? {
            bankId: user.profile!.payoutBankId!,
            bankName: getPayoutOptionName(user.profile!.payoutBankId) ?? '—',
            accountType: user.profile!.payoutAccountType!,
            account: user.profile!.payoutAccount!,
            holder: user.profile!.payoutHolder!,
          }
        : null,
      previewFullBalance: {
        ...breakdown,
      },
      pendingRequest: pending ? this.serialize(pending) : null,
    };
  }

  preview(userId: string, credits: number) {
    return this.buildPreview(userId, credits);
  }

  async list(userId: string) {
    await this.requireModel(userId);
    const rows = await this.prisma.payoutRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => this.serialize(r));
  }

  async create(userId: string, credits: number) {
    const user = await this.requireModel(userId);
    const profile = user.profile;
    const bankId = profile?.payoutBankId;
    const accountType = profile?.payoutAccountType;
    const account = profile?.payoutAccount?.trim();
    const holder = profile?.payoutHolder?.trim();
    if (!bankId || !accountType || !account || !holder) {
      throw new BadRequestException(
        'Configura tu cuenta de cobro en Ajustes antes de solicitar un retiro',
      );
    }

    const gross = Math.floor(credits);
    if (gross < MIN_PAYOUT_CREDITS) {
      throw new BadRequestException(
        `El retiro mínimo es de ${MIN_PAYOUT_CREDITS} créditos`,
      );
    }

    const existingPending = await this.prisma.payoutRequest.findFirst({
      where: {
        userId,
        status: { in: [PayoutRequestStatus.PENDING, PayoutRequestStatus.PROCESSING] },
      },
    });
    if (existingPending) {
      throw new BadRequestException(
        'Ya tienes un retiro pendiente. Espera a que se procese el actual.',
      );
    }

    const breakdown = calcPayoutBreakdown(gross);
    const scheduledFor = new Date();
    scheduledFor.setHours(12, 0, 0, 0);

    const request = await this.prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId } });
      }
      if (wallet.balance < gross) {
        throw new BadRequestException(
          `Saldo insuficiente. Tienes ${wallet.balance} créditos`,
        );
      }

      const balanceAfter = wallet.balance - gross;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });
      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: 'PAYOUT',
          amount: -gross,
          balanceAfter,
          description: `Retiro solicitado (−${breakdown.feeCredits} comisión 15%)`,
        },
      });

      return tx.payoutRequest.create({
        data: {
          userId,
          creditsGross: breakdown.creditsGross,
          feeCredits: breakdown.feeCredits,
          netCredits: breakdown.netCredits,
          amountCop: breakdown.amountCop,
          feeRate: PLATFORM_PAYOUT_FEE_RATE,
          status: PayoutRequestStatus.PENDING,
          payoutBankId: bankId,
          payoutAccountType: accountType,
          payoutAccount: account,
          payoutHolder: holder,
          scheduledFor,
        },
      });
    });

    return this.serialize(request);
  }

  private async buildPreview(userId: string, credits: number) {
    await this.requireModel(userId);
    const gross = Math.floor(credits);
    const breakdown = calcPayoutBreakdown(gross);
    return {
      ...breakdown,
      minCredits: MIN_PAYOUT_CREDITS,
      creditValueCop: CREDIT_VALUE_COP,
      canRequest: gross >= MIN_PAYOUT_CREDITS,
    };
  }

  private async requireModel(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, wallet: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role !== UserRole.MODEL) {
      throw new ForbiddenException('Solo las modelos pueden solicitar retiros');
    }
    return user;
  }

  private serialize(row: {
    id: string;
    creditsGross: number;
    feeCredits: number;
    netCredits: number;
    amountCop: number;
    feeRate: number;
    status: PayoutRequestStatus;
    payoutBankId: number;
    payoutAccountType: string;
    payoutAccount: string;
    payoutHolder: string;
    scheduledFor: Date;
    paidAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: row.id,
      creditsGross: row.creditsGross,
      feeCredits: row.feeCredits,
      netCredits: row.netCredits,
      amountCop: row.amountCop,
      feeRate: row.feeRate,
      status: row.status,
      bankName: getPayoutOptionName(row.payoutBankId) ?? '—',
      payoutAccountType: row.payoutAccountType,
      payoutAccount: row.payoutAccount,
      payoutHolder: row.payoutHolder,
      scheduledFor: row.scheduledFor.toISOString().slice(0, 10),
      paidAt: row.paidAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async listForAdmin(status?: string) {
    const where =
      status && status !== 'ALL'
        ? { status: status as PayoutRequestStatus }
        : {};
    const rows = await this.prisma.payoutRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true, username: true } },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 100,
    });

    return rows.map((row) => ({
      ...this.serialize(row),
      userId: row.user.id,
      email: row.user.email,
      displayName: row.user.profile?.displayName ?? 'Modelo',
      username: row.user.profile?.username ?? '',
    }));
  }

  async markPaid(id: string) {
    const row = await this.prisma.payoutRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Retiro no encontrado');
    if (row.status === PayoutRequestStatus.PAID) {
      return this.serialize(row);
    }
    if (
      row.status !== PayoutRequestStatus.PENDING &&
      row.status !== PayoutRequestStatus.PROCESSING
    ) {
      throw new BadRequestException(`No se puede pagar un retiro en estado ${row.status}`);
    }

    const updated = await this.prisma.payoutRequest.update({
      where: { id },
      data: {
        status: PayoutRequestStatus.PAID,
        paidAt: new Date(),
      },
    });
    return this.serialize(updated);
  }

  async markRejected(id: string, note?: string) {
    const row = await this.prisma.payoutRequest.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Retiro no encontrado');
    if (row.status === PayoutRequestStatus.REJECTED) {
      return this.serialize(row);
    }
    if (row.status === PayoutRequestStatus.PAID) {
      throw new BadRequestException('El retiro ya fue pagado');
    }
    if (
      row.status !== PayoutRequestStatus.PENDING &&
      row.status !== PayoutRequestStatus.PROCESSING
    ) {
      throw new BadRequestException(`No se puede rechazar un retiro en estado ${row.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({ where: { userId: row.userId } });
      if (!wallet) {
        wallet = await tx.wallet.create({ data: { userId: row.userId } });
      }
      const balanceAfter = wallet.balance + row.creditsGross;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });
      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          userId: row.userId,
          type: 'REFUND',
          amount: row.creditsGross,
          balanceAfter,
          description: `Reembolso retiro rechazado`,
          referenceId: row.id,
        },
      });

      return tx.payoutRequest.update({
        where: { id },
        data: {
          status: PayoutRequestStatus.REJECTED,
          note: note?.trim() || 'Rechazado por admin',
        },
      });
    });

    return this.serialize(updated);
  }
}
