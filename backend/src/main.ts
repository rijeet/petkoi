import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './APP.Shared/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body size limit to 10MB (for image uploads and base64 data)
  // This applies to JSON and URL-encoded bodies
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));
  app.use(cookieParser());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // CORS configuration - use environment variables
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins: (string | RegExp)[] = [frontendUrl];
  
  // Add localhost for development if not already included
  if (!frontendUrl.includes('localhost')) {
    allowedOrigins.push('http://localhost:3000');
  }
  
  // Add regex pattern for Render domains if in production
  if (process.env.NODE_ENV === 'production') {
    allowedOrigins.push(/\.onrender\.com$/);
  }
  
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Pet Koi')
    .setDescription('REST API for Pet Koi - QR codes, GPS tracking, and community features')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('pets', 'Pet management')
    .addTag('pet-images', 'Pet image uploads (ImageKit)')
    .addTag('gps', 'GPS location tracking')
    .addTag('notifications', 'User notifications')
    .addTag('community', 'Community posts and comments')
    .addTag('directory', 'Guards and waste collectors directory')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs/api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
}

bootstrap();

