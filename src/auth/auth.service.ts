import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compare, hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import type { SignOptions } from 'jsonwebtoken';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UsersService } from 'src/users/users.service';
import { IsNull, Repository } from 'typeorm';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthSession } from './entities/auth-session.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshTokenPayload } from './interfaces/refresh-token-payload.interface';

type TokenUserData = {
  userId: number;
  email: string;
  role: UserRole;
};

type JwtExpiresIn = SignOptions['expiresIn'];

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(AuthSession)
    private readonly authSessionRepository: Repository<AuthSession>,
  ) { }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const passwordHash = await hash(registerDto.password, this.saltRounds);

    const user = await this.usersService.create({
      identification: registerDto.identification,
      firstName: registerDto.firstName,
      secondName: registerDto.secondName ?? null,
      firstLastName: registerDto.firstLastName,
      secondLastName: registerDto.secondLastName ?? null,
      email: registerDto.email,
      passwordHash,
    });

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user.userId);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithPassword(
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const isPasswordValid = await compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const userResponse = this.usersService.toResponseDto(user);
    const accessToken = await this.generateAccessToken(userResponse);
    const refreshToken = await this.generateRefreshToken(user.userId);

    return {
      accessToken,
      refreshToken,
      user: userResponse,
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const payload = await this.verifyRefreshToken(refreshTokenDto.refreshToken);

    const session = await this.authSessionRepository
      .createQueryBuilder('session')
      .addSelect('session.refreshTokenHash')
      .where('session.refreshTokenJti = :jti', { jti: payload.jti })
      .andWhere('session.userId = :userId', { userId: payload.sub })
      .getOne();

    if (!session) {
      throw new UnauthorizedException('Sesión no válida.');
    }

    if (session.revokedAt !== null) {
      throw new UnauthorizedException('La sesión ya fue cerrada.');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('La sesión expiró.');
    }

    const isRefreshTokenValid = await compare(
      refreshTokenDto.refreshToken,
      session.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Refresh token inválido.');
    }

    const user = await this.usersService.getUserResponseById(payload.sub);

    const newRefreshTokenJti = randomUUID();
    const newRefreshToken = await this.signRefreshToken(
      user.userId,
      newRefreshTokenJti,
    );

    const newRefreshTokenHash = await hash(newRefreshToken, this.saltRounds);

    session.revokedAt = new Date();
    session.replacedByJti = newRefreshTokenJti;
    await this.authSessionRepository.save(session);

    const newSession = this.authSessionRepository.create({
      userId: user.userId,
      refreshTokenJti: newRefreshTokenJti,
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: this.getRefreshTokenExpirationDate(),
      revokedAt: null,
      replacedByJti: null,
    });

    await this.authSessionRepository.save(newSession);

    const accessToken = await this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user,
    };
  }

  async logout(refreshTokenDto: RefreshTokenDto): Promise<LogoutResponseDto> {
    const payload = await this.verifyRefreshToken(refreshTokenDto.refreshToken);

    const session = await this.authSessionRepository.findOne({
      where: {
        refreshTokenJti: payload.jti,
        userId: payload.sub,
        revokedAt: IsNull(),
      },
    });

    if (session) {
      session.revokedAt = new Date();
      await this.authSessionRepository.save(session);
    }

    return {
      message: 'Sesión cerrada correctamente.',
    };
  }

  async logoutAll(userId: number): Promise<LogoutResponseDto> {
    await this.authSessionRepository.update(
      {
        userId,
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );

    return {
      message: 'Todas las sesiones fueron cerradas correctamente.',
    };
  }

  private async generateAccessToken(user: TokenUserData): Promise<string> {
    const payload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
      tokenType: 'access',
    };

    const expiresIn = (
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m'
    ) as JwtExpiresIn;

    return await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn,
    });
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const refreshTokenJti = randomUUID();
    const refreshToken = await this.signRefreshToken(userId, refreshTokenJti);

    const refreshTokenHash = await hash(refreshToken, this.saltRounds);

    const session = this.authSessionRepository.create({
      userId,
      refreshTokenJti,
      refreshTokenHash,
      expiresAt: this.getRefreshTokenExpirationDate(),
      revokedAt: null,
      replacedByJti: null,
    });

    await this.authSessionRepository.save(session);

    return refreshToken;
  }

  private async signRefreshToken(
    userId: number,
    refreshTokenJti: string,
  ): Promise<string> {
    const payload: RefreshTokenPayload = {
      sub: userId,
      jti: refreshTokenJti,
      tokenType: 'refresh',
    };

    const expiresIn = (
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d'
    ) as JwtExpiresIn;

    return await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn,
    });
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<RefreshTokenPayload> {
    try {
      return await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        },
      );
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado.');
    }
  }

  private getRefreshTokenExpirationDate(): Date {
    const expirationDaysValue =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN_DAYS') ?? '7';

    const expirationDays = Number(expirationDaysValue);

    if (!Number.isInteger(expirationDays) || expirationDays <= 0) {
      throw new InternalServerErrorException(
        'La configuración del refresh token no es válida.',
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    return expiresAt;
  }
}