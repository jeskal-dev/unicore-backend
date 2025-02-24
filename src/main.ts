import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

declare const module: any;

const config = new DocumentBuilder()
  .setTitle('UniCore API')
  .setDescription('API centralizada para todos mis proyectos')
  .setVersion('0.1')
  .addBearerAuth()
  .build();

export const setupSwagger = (app: INestApplication<any>) => {
  const SwaggerFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, SwaggerFactory);
};

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const config = app.get(ConfigService);
  const port = config.port;

  // Configuración de Swagger
  setupSwagger(app);
  app.enableCors();
  await app.listen(port);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
