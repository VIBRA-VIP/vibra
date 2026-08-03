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
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { statfs } from 'node:fs/promises';
import * as os from 'node:os';
import { PrismaService } from '../../../database/prisma.service';
import type { Env } from '../../../config/env.schema';
import { MailService } from '../../mail/mail.service';

const ROTATE_EVERY_MS = 5 * 60 * 60 * 1000; // 5 hours
const CHECK_EVERY_MS = 5 * 60 * 1000; // check every 5 minutes

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
      `Admin key rotated. Copy key_plain from admin_secrets in the DB (valid ~5h).`,
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

  async getDashboard() {
    const [users, system, s3, uploadsDisk] = await Promise.all([
      this.userStats(),
      Promise.resolve(this.systemStats()),
      this.s3Stats(),
      this.uploadsDiskStats(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      users,
      system,
      disk: uploadsDisk,
      s3,
    };
  }

  private async userStats() {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1),
    );

    const [
      totalUsers,
      totalClients,
      totalModels,
      activeUsers,
      newThisMonth,
      newLast30Days,
      modelsPending,
      modelsApproved,
      modelsRejected,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.CLIENT } }),
      this.prisma.user.count({ where: { role: UserRole.MODEL } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.profile.count({
        where: {
          verificationStatus: VerificationStatus.PENDING,
          user: { role: UserRole.MODEL },
        },
      }),
      this.prisma.profile.count({
        where: {
          verificationStatus: VerificationStatus.APPROVED,
          user: { role: UserRole.MODEL },
        },
      }),
      this.prisma.profile.count({
        where: {
          verificationStatus: VerificationStatus.REJECTED,
          user: { role: UserRole.MODEL },
        },
      }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true, role: true },
      }),
    ]);

    const monthKey = (d: Date) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

    const months: { month: string; total: number; clients: number; models: number }[] = [];
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      months.push({ month: monthKey(d), total: 0, clients: 0, models: 0 });
    }
    const byMonth = new Map(months.map((m) => [m.month, m]));
    for (const u of recentUsers) {
      const key = monthKey(u.createdAt);
      const row = byMonth.get(key);
      if (!row) continue;
      row.total += 1;
      if (u.role === UserRole.CLIENT) row.clients += 1;
      if (u.role === UserRole.MODEL) row.models += 1;
    }

    return {
      totalUsers,
      totalClients,
      totalModels,
      activeUsers,
      newThisMonth,
      newLast30Days,
      modelsPending,
      modelsApproved,
      modelsRejected,
      monthly: months,
    };
  }

  private systemStats() {
    const cpus = os.cpus();
    const load = os.loadavg();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    return {
      hostname: os.hostname(),
      platform: os.platform(),
      uptimeSec: Math.round(os.uptime()),
      cpuCount: cpus.length,
      cpuModel: cpus[0]?.model?.trim() ?? 'unknown',
      loadAvg1: Number(load[0]?.toFixed(2) ?? 0),
      loadAvg5: Number(load[1]?.toFixed(2) ?? 0),
      loadAvg15: Number(load[2]?.toFixed(2) ?? 0),
      /** Rough CPU pressure: 1-min load / cores (0–1+). */
      cpuUsageRatio: cpus.length
        ? Number(((load[0] ?? 0) / cpus.length).toFixed(3))
        : 0,
      memory: {
        totalBytes: totalMem,
        usedBytes: usedMem,
        freeBytes: freeMem,
        usedRatio: totalMem ? Number((usedMem / totalMem).toFixed(3)) : 0,
      },
    };
  }

  private async uploadsDiskStats() {
    const targets = ['/app/uploads', process.cwd(), '/'];
    for (const target of targets) {
      try {
        const s = await statfs(target);
        const totalBytes = Number(s.blocks) * Number(s.bsize);
        const freeBytes = Number(s.bfree) * Number(s.bsize);
        const availableBytes = Number(s.bavail) * Number(s.bsize);
        const usedBytes = totalBytes - freeBytes;
        return {
          path: target,
          totalBytes,
          usedBytes,
          freeBytes,
          availableBytes,
          usedRatio: totalBytes ? Number((usedBytes / totalBytes).toFixed(3)) : 0,
        };
      } catch {
        // try next path
      }
    }
    return {
      path: null as string | null,
      totalBytes: 0,
      usedBytes: 0,
      freeBytes: 0,
      availableBytes: 0,
      usedRatio: 0,
      error: 'No se pudo leer el disco',
    };
  }

  private async s3Stats() {
    const bucket = this.config.get('S3_BUCKET', { infer: true });
    const region = this.config.get('S3_REGION', { infer: true }) ?? 'us-east-2';
    const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID', { infer: true });
    const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY', { infer: true });

    if (!bucket || !accessKeyId || !secretAccessKey) {
      return {
        configured: false,
        bucket: bucket ?? null,
        region,
        objectCount: 0,
        totalBytes: 0,
        error: 'S3 no configurado',
      };
    }

    try {
      const s3 = new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
      });

      let continuationToken: string | undefined;
      let objectCount = 0;
      let totalBytes = 0;
      let pages = 0;
      const maxPages = 50; // safety cap (~50k objects listed)

      do {
        const res = await s3.send(
          new ListObjectsV2Command({
            Bucket: bucket,
            ContinuationToken: continuationToken,
            MaxKeys: 1000,
          }),
        );
        for (const obj of res.Contents ?? []) {
          objectCount += 1;
          totalBytes += obj.Size ?? 0;
        }
        continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
        pages += 1;
      } while (continuationToken && pages < maxPages);

      return {
        configured: true,
        bucket,
        region,
        objectCount,
        totalBytes,
        truncated: Boolean(continuationToken),
      };
    } catch (err) {
      this.logger.error('S3 stats failed', err);
      return {
        configured: true,
        bucket,
        region,
        objectCount: 0,
        totalBytes: 0,
        error: err instanceof Error ? err.message : 'Error al leer S3',
      };
    }
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
