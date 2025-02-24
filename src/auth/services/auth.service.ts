import { ConfigService } from '@/config/config.service';
import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { compareSync, hashSync } from 'bcrypt';
import { RegisterDto } from '../dto/register.dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async profile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        avatar: true,
        displayName: true,
        bio: true,
        roles: true,
        username: true,
        refreshToken: false,
        password: false,
      },
    });
  }

  async register(data: RegisterDto) {
    const { email, password, username } = data;
    const hashedPassword = hashSync(password, 10);

    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      throw new ConflictException('El nombre de usuario ya está en uso.');
    }

    const defaultRole = await this.prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: { name: 'USER' },
    });

    return this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=${data.username}`,
        roles: {
          connect: [{ name: defaultRole.name }],
        },
      },
    });
  }

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });

    const isCorrectPassword = compareSync(password, user?.password ?? '');
    if (!user || !isCorrectPassword) throw new ForbiddenException();

    return user;
  }

  async login(user: User) {
    const { id, username, email } = user;
    const payload = { sub: id, username, email };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: '7d',
    });

    const hashedRefreshToken = hashSync(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async logout(token: string) {
    try {
      const payload = this.jwt.verify(token, {
        secret: this.config.jwtAccessSecret,
      });

      if (!payload.sub) {
        throw new BadRequestException('Invalid token payload');
      }

      const userId = payload.sub;

      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw new BadRequestException('An error occurred during logout');
    }
  }

  async refreshTokens(refreshToken: string) {
    const { sub: id } = this.jwt.verify(refreshToken, {
      secret: this.config.jwtRefreshSecret,
    });

    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user?.refreshToken) throw new NotFoundException();

    const isRefreshTokenValid = compareSync(refreshToken, user.refreshToken);
    if (!isRefreshTokenValid) throw new ForbiddenException();

    const payload = { sub: id, username: user.username, email: user.email };
    const accessToken = this.jwt.sign(payload);
    const newRefreshToken = this.jwt.sign(payload, {
      secret: this.config.jwtRefreshSecret,
      expiresIn: '7d',
    });
    const hashedNewRefreshToken = hashSync(newRefreshToken, 10);
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken: hashedNewRefreshToken },
    });

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
    };
  }
}
