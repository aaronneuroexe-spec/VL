import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { SocketIoAdapter } from './websocket/socket-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Ensure required env vars in production
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  if (nodeEnv === 'production') {
    const required = ['JWT_SECRET', 'DATABASE_URL', 'REDIS_URL'];
    const missing = required.filter((k) => !configService.get(k));
    if (missing.length) {
      console.error(`Missing required env vars in production: ${missing.join(', ')}`);
      process.exit(1);
    }
  }

  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: configService.get('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  if (configService.get('ENABLE_SWAGGER', true)) {
    const config = new DocumentBuilder()
      .setTitle('VoxLink API')
      .setDescription('Voice Communication Platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT', 4000);
  const host = configService.get('APP_HOST', '0.0.0.0');

  // Use SocketIoAdapter with CORS from config
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  app.useWebSocketAdapter(new SocketIoAdapter(app, frontendUrl));
  
  await app.listen(port, host);
  
  console.log(`🚀 VoxLink Backend running on http://${host}:${port}`);
  console.log(`📚 API Documentation: http://${host}:${port}/api/docs`);
}

bootstrap();
