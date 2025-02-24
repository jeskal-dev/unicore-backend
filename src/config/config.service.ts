import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  get port(): number {
    return this.configService.get<number>('APP_PORT') ?? 8000;
  }

  get jwtAccessSecret() {
    return (
      this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'JWT_ACCESS_SECRET'
    );
  }

  get jwtRefreshSecret() {
    return (
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'JWT_REFRESH_SECRET'
    );
  }
}
