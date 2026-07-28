import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole, type Profile, type User, type Wallet } from '@prisma/client';
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
    const email = dto.email.toLowerCase().trim();
    const username = dto.username.toLowerCase().trim();
    const role = dto.role === UserRole.MODEL ? UserRole.MODEL : UserRole.CLIENT;

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { profile: { username } }],
      },
    });
    if (existing) {
      throw new ConflictException('El correo o usuario ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        profile: {
          create: {
            displayName: dto.displayName.trim(),
            username,
          },
        },
        wallet: {
          create: { balance: 100 },
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
    return { ok: true };
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
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
      profile: user.profile
        ? {
            id: user.profile.id,
            displayName: user.profile.displayName,
            username: user.profile.username,
            avatarUrl: user.profile.avatarUrl,
          }
        : null,
      walletBalance: user.wallet?.balance ?? 0,
    };
  }
}
