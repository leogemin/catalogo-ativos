import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiExceptionFilter } from './common/filters/api-exception.filter.js';
import type { EnvironmentVariables } from './config/env.validation.js';

/** Configuração HTTP compartilhada entre `main.ts` e os testes e2e. */
export function configureApp(app: INestApplication): void {
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.setGlobalPrefix(config.get('API_PREFIX', { infer: true }));

  const origins = config
    .get('CORS_ORIGINS', { infer: true })
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: origins.includes('*') ? true : origins,
    // Permite ao frontend ler o nome do arquivo no download do CSV.
    exposedHeaders: ['Content-Disposition'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();
}

export function setupSwagger(app: INestApplication): string {
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);
  const path = `${config.get('API_PREFIX', { infer: true })}/docs`;

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Catálogo de Ativos API')
      .setDescription('CRUD de catálogos e de seus itens (ativos e bienes no objeto), com importação/exportação CSV.')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  // Toda rota exige token (exceto POST /auth/login); o "Authorize" do Swagger aplica a todas.
  document.security = [{ bearer: [] }];
  SwaggerModule.setup(path, app, document, { swaggerOptions: { persistAuthorization: true } });
  return path;
}
