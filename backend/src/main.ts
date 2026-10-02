import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp, setupSwagger } from './app.setup.js';
import type { EnvironmentVariables } from './config/env.validation.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const docsPath = setupSwagger(app);

  const port = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService).get('PORT', { infer: true });
  await app.listen(port);

  const url = await app.getUrl();
  Logger.log(`API em ${url} · documentação em ${url}/${docsPath}`, 'Bootstrap');
}
await bootstrap();
