import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import express, { Request, Response } from 'express';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/APP.Shared/filters/global-exception.filter';

// Ensure Prisma Client is generated
import '@prisma/client';

let cachedApp: express.Express;

async function createApp(): Promise<express.Express> {
  if (cachedApp) {
    return cachedApp;
  }

  console.log('Initializing NestJS application for Vercel...');
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Missing',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Missing',
  });
  
  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);
  
  try {
    const app = await NestFactory.create(AppModule, adapter, {
      logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // Increase body size limit to 10MB
    expressApp.use(json({ limit: '10mb' }));
    expressApp.use(urlencoded({ limit: '10mb', extended: true }));
    expressApp.use(cookieParser());
    
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

    // CORS configuration
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const allowedOrigins: (string | RegExp)[] = [frontendUrl];
    
    if (!frontendUrl.includes('localhost')) {
      allowedOrigins.push('http://localhost:3000');
    }
    
    // Add Vercel and other production domains
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      allowedOrigins.push(/\.vercel\.app$/);
      allowedOrigins.push(/\.onrender\.com$/);
    }
    
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });

    await app.init();
    
    console.log('NestJS application initialized successfully');
    
    cachedApp = expressApp;
    return expressApp;
  } catch (error) {
    console.error('Failed to initialize NestJS app:', error);
    throw error;
  }
}

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const app = await createApp();
    app(req, res);
  } catch (error) {
    console.error('Error in serverless function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      url: req.url,
      method: req.method,
    });
    
    if (!res.headersSent) {
      res.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
        path: req.url,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV !== 'production' && { error: errorMessage }),
      });
    }
  }
}

