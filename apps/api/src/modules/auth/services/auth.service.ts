import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ProfileGender,
  UserRole,
  VerificationStatus,
  type Profile,
  type User,
  type Wallet,
} from '@prisma/client';
import { inventUsername } from '@vibra/shared';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../database/prisma.service';
import type { Env } from '../../../config/env.schema';
import type { LoginDto } from '../dto/login.dto';
import type { RegisterDto } from '../dto/register.dto';

type UserWithRelations = User & {
  profile: Profile | null;
  wallet: Wallet | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  health() {
    return { module: 'auth', status: 'ok' };
  }

  async register(dto: RegisterDto) {
    if (!dto.acceptedTerms) {
      throw new BadRequestException('Debes aceptar términos y ser mayor de 18 años');
    }

    const email = dto.email.toLowerCase().trim();
    const role = dto.role === UserRole.MODEL ? UserRole.MODEL : UserRole.CLIENT;
    const gender = dto.gender === ProfileGender.MALE ? ProfileGender.MALE : ProfileGender.FEMALE;

    const existingEmail = await this.prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      throw new ConflictException('El correo ya está registrado');
    }

    const username = await this.allocateUsername(dto.displayName);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const idDocumentUrl = dto.idDocumentUrl?.trim() || null;
    const isModel = role === UserRole.MODEL;

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        acceptedTermsAt: new Date(),
        profile: {
          create: {
            displayName: dto.displayName.trim(),
            username,
            gender,
            profileCompleted: false,
            verificationStatus: isModel
              ? VerificationStatus.PENDING
              : VerificationStatus.NOT_REQUIRED,
            idDocumentUrl: isModel ? idDocumentUrl : null,
            verificationSubmittedAt: isModel && idDocumentUrl ? new Date() : null,
          },
        },
        wallet: {
          create: { balance: role === UserRole.CLIENT ? 100 : 0 },
        },
      },
      include: { profile: true, wallet: true },
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true, wallet: true },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });
    if (user.profile) {
      await this.prisma.profile.update({
        where: { userId: user.id },
        data: { isOnline: true },
      });
      user.profile.isOnline = true;
    }

    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, wallet: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.toPublicUser(user);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const hash = this.hashToken(refreshToken);
      await this.prisma.session.updateMany({
        where: { userId, refreshTokenHash: hash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await this.prisma.profile.updateMany({
      where: { userId },
      data: { isOnline: false },
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
    return { ok: true };
  }

  private async allocateUsername(displayName: string) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const candidate = inventUsername(`${displayName}-${attempt}-${Date.now()}`);
      const taken = await this.prisma.profile.findUnique({ where: { username: candidate } });
      if (!taken) return candidate;
    }
    return inventUsername(`${Date.now()}-${Math.random()}`);
  }

  private async buildAuthResponse(user: UserWithRelations) {
    const tokens = await this.issueTokens(user.id, user.email, user.role);
    return {
      user: this.toPublicUser(user),
      ...tokens,
    };
  }

  private async issueTokens(userId: string, email: string, role: UserRole) {
    const expiresIn = this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true });
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: expiresIn as '15m',
      },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const refreshDays = 7;
    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private toPublicUser(user: UserWithRelations) {
    const verificationStatus =
      user.profile?.verificationStatus ?? VerificationStatus.NOT_REQUIRED;
    const isModel = user.role === UserRole.MODEL;
    const needsVerification =
      isModel && verificationStatus !== VerificationStatus.APPROVED;

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      acceptedTermsAt: user.acceptedTermsAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      profile: user.profile
        ? {
            id: user.profile.id,
            displayName: user.profile.displayName,
            username: user.profile.username,
            avatarUrl: user.profile.avatarUrl,
            bio: user.profile.bio,
            gender: user.profile.gender,
            tags: user.profile.tags,
            profileCompleted: user.profile.profileCompleted,
            verificationStatus,
            isVerified: user.profile.isVerified,
            hasIdDocument: Boolean(user.profile.idDocumentUrl),
            chatPricePerMin: user.profile.chatPricePerMin,
            videoPricePerMin: user.profile.videoPricePerMin,
            messagePrice: user.profile.messagePrice,
            contentPrice: user.profile.contentPrice,
            acceptsEncounters: user.profile.acceptsEncounters,
            attributes: (user.profile.attributes as Record<string, unknown> | null) ?? {},
            payoutBankId: user.profile.payoutBankId,
            payoutAccountType: user.profile.payoutAccountType,
            payoutAccount: user.profile.payoutAccount,
            payoutHolder: user.profile.payoutHolder,
          }
        : null,
      walletBalance: user.wallet?.balance ?? 0,
      needsOnboarding: !(user.profile?.profileCompleted ?? false),
      needsVerification,
      verificationStatus,
    };
  }
}
