import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './APP.Shared/filters/global-exception.filter';

function validateEnvironmentVariables() {
  const required = [
    'DATABASE_URL',
    'JWT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_CALLBACK_URL',
  ];
  
  const missing: string[] = [];
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease set these variables in your environment or .env file.');
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ All required environment variables are set');
}

async function bootstrap() {
  // Validate environment variables before starting
  validateEnvironmentVariables();
  
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
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
  
  const config = new DocumentBuilder()
    .setTitle('Pet Koi API')
    .setDescription('REST API for Pet Koi - QR codes, GPS tracking, and community features. This API provides endpoints for pet management, user authentication, order processing, and community interactions.')
    .setVersion('1.0')
    .addServer(apiUrl, 'Current server')
    .addServer('http://localhost:3001', 'Local development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token obtained from /auth/google or /auth/refresh',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints - Google OAuth, JWT tokens, sessions')
    .addTag('users', 'User management - Profile, settings, user data')
    .addTag('pets', 'Pet management - Create, update, view pet profiles')
    .addTag('pet-images', 'Pet image uploads - ImageKit integration for pet photos')
    .addTag('pet-tags', 'Pet tag orders - Order custom QR code tags for pets')
    .addTag('orders', 'Order management - View and manage pet tag orders')
    .addTag('payments', 'Payment processing - Manual payment submission and verification')
    .addTag('gps', 'GPS location tracking - Track pet locations with geohash')
    .addTag('notifications', 'User notifications - Lost pet alerts and updates')
    .addTag('community', 'Community posts and comments - Share posts, upvote, comment')
    .addTag('directory', 'Directory services - Guards and waste collectors information')
    .addTag('admin', 'Admin endpoints - Order tracking, user management, statistics')
    .addTag('admin-auth', 'Admin authentication - Admin login, OTP verification')
    .addTag('health', 'Health checks - Service health and readiness')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs/api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`✅ Backend running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/docs/api`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});

