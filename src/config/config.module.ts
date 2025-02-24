import { Module } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envValidation } from './env.validation';
@Module({
  imports: [NestConfigModule.forRoot({
    isGlobal: true,
    validationSchema: envValidation
  })],
  providers: [ConfigService],
  exports: [ConfigService]
})
export class ConfigModule {

}
