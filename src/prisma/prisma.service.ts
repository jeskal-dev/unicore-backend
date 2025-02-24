import { INestApplication, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  async enableShutdownHooks(app: INestApplication) {
    const event = 'beforeExit' as never
    this.$on(event, async () => {
      await app.close();
    });
  }
}
