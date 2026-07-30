import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, VerificationStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../../database/prisma.service';
import type { Env } from '../../../config/env.schema';
import { MailService } from '../../mail/mail.service';

const ROTATE_EVERY_MS = 24 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 60 * 60 * 1000; // check hourly

@Injectable()
export class AdminService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AdminService.name);
  private rotateTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly mail: MailService,
  ) {}

  health() {
    return { module: 'admin', status: 'ok' };
  }

  async onModuleInit() {
    await this.ensureAndRotateAdminSecret();
    this.rotateTimer = setInterval(() => {
      void this.ensureAndRotateAdminSecret().catch((err) =>
        this.logger.error('Admin key rotation check failed', err),
      );
    }, CHECK_EVERY_MS);
  }

  onModuleDestroy() {
    if (this.rotateTimer) clearInterval(this.rotateTimer);
  }

  /** Generate a strong one-time key and save hash + plaintext in DB. */
  private async rotateAdminKey(existingId?: string) {
    const plain = `vibra-${randomBytes(18).toString('base64url')}`;
    const keyHash = await bcrypt.hash(plain, 12);
    const now = new Date();

    if (existingId) {
      await this.prisma.adminSecret.update({
        where: { id: existingId },
        data: { keyHash, keyPlain: plain, rotatedAt: now, label: 'rotating' },
      });
    } else {
      await this.prisma.adminSecret.create({
        data: {
          keyHash,
          keyPlain: plain,
          rotatedAt: now,
          label: 'rotating',
        },
      });
    }

    this.logger.warn(
      `Admin key rotated. Copy key_plain from admin_secrets in the DB (valid ~24h).`,
    );
    return plain;
  }

  private async ensureAndRotateAdminSecret() {
    const existing = await this.prisma.adminSecret.findFirst({
      orderBy: { createdAt: 'asc' },
    });

    if (!existing) {
      await this.rotateAdminKey();
      return;
    }

    // Backfill plaintext if empty (migration default)
    if (!existing.keyPlain) {
      await this.rotateAdminKey(existing.id);
      return;
    }

    const ageMs = Date.now() - new Date(existing.rotatedAt).getTime();
    if (ageMs >= ROTATE_EVERY_MS) {
      await this.rotateAdminKey(existing.id);
    }
  }

  async unlock(key: string) {
    await this.ensureAndRotateAdminSecret();

    const secret = await this.prisma.adminSecret.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (!secret) {
      throw new UnauthorizedException('Admin no configurado');
    }

    const ageMs = Date.now() - new Date(secret.rotatedAt).getTime();
    if (ageMs >= ROTATE_EVERY_MS) {
      throw new UnauthorizedException('Clave expirada. Revisa la DB por la clave nueva.');
    }

    const ok = await bcrypt.compare(key.trim(), secret.keyHash);
    if (!ok) {
      throw new UnauthorizedException('Clave de administrador incorrecta');
    }

    const expiresIn = '8h';
    const accessToken = await this.jwt.signAsync(
      { sub: 'admin', role: 'ADMIN', admin: true },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn,
      },
    );

    return { accessToken, expiresIn };
  }

  async listPendingModels() {
    const profiles = await this.prisma.profile.findMany({
      where: {
        verificationStatus: VerificationStatus.PENDING,
        user: { role: UserRole.MODEL, isActive: true },
      },
      orderBy: [{ verificationSubmittedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { id: true, email: true, createdAt: true } },
      },
      take: 100,
    });

    return profiles.map((p) => ({
      userId: p.userId,
      email: p.user.email,
      displayName: p.displayName,
      username: p.username,
      gender: p.gender,
      age: p.age,
      birthDate: p.birthDate ? p.birthDate.toISOString().slice(0, 10) : null,
      avatarUrl: p.avatarUrl,
      idDocumentUrl: p.idDocumentUrl,
      idDocumentBackUrl: p.idDocumentBackUrl,
      verificationStatus: p.verificationStatus,
      verificationSubmittedAt: p.verificationSubmittedAt?.toISOString() ?? null,
      profileCompleted: p.profileCompleted,
      createdAt: p.user.createdAt.toISOString(),
    }));
  }

  async approveModel(modelUserId: string) {
    const result = await this.setVerification(
      modelUserId,
      VerificationStatus.APPROVED,
      true,
    );
    try {
      await this.mail.sendModelVerified(result.email, result.displayName);
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${result.email}`, err);
    }
    return {
      userId: result.userId,
      verificationStatus: result.verificationStatus,
      isVerified: result.isVerified,
    };
  }

  async rejectModel(modelUserId: string) {
    const result = await this.setVerification(
      modelUserId,
      VerificationStatus.REJECTED,
      false,
    );
    try {
      await this.mail.sendModelRejected(result.email, result.displayName);
    } catch (err) {
      this.logger.error(`Failed to send rejection email to ${result.email}`, err);
    }
    return {
      userId: result.userId,
      verificationStatus: result.verificationStatus,
      isVerified: result.isVerified,
    };
  }

  private async setVerification(
    modelUserId: string,
    status: VerificationStatus,
    isVerified: boolean,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: modelUserId },
      include: { profile: true },
    });
    if (!user?.profile) throw new NotFoundException('Modelo no encontrada');
    if (user.role !== UserRole.MODEL) {
      throw new BadRequestException('Solo se pueden verificar perfiles de modelo');
    }

    const profile = await this.prisma.profile.update({
      where: { userId: modelUserId },
      data: {
        verificationStatus: status,
        isVerified,
      },
    });

    return {
      userId: modelUserId,
      email: user.email,
      displayName: profile.displayName,
      verificationStatus: profile.verificationStatus,
      isVerified: profile.isVerified,
    };
  }
}
