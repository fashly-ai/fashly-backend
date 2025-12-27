/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS for frontend integration
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable global validation
  app.useGlobalPipes(new ValidationPipe());

  // Increase payload size limit for image uploads
  app.use('/api/image/add-sunglasses', (req: any, res: any, next: any) => {
    req.headers['content-length'] = req.headers['content-length'] || '10485760'; // 10MB
    next();
  });

  const port = configService.get('PORT', 3000);

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Fashionfy Demo Integration API')
    .setDescription(
      'Complete fashion platform API with authentication, file storage, virtual try-on, and web crawling capabilities',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token (without "Bearer" prefix)',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('profile', 'User profile management')
    .addTag('s3', 'File storage endpoints')
    .addTag('virtual-tryon', 'Virtual try-on AI endpoints')
    .addTag('fashn', 'FASHN Virtual Try-On endpoints')
    .addTag('crawling', 'Web crawling endpoints')
    .addTag('glasses', 'Glasses catalog endpoints')
    .addTag('clothes', 'Clothes catalog endpoints')
    .addTag('comfyui', 'ComfyUI image processing endpoints')
    .addTag('general', 'General API endpoints')
    .addServer(`http://localhost:${port}`, 'Development server')
    .addServer(`https://api.fashionfy.com`, 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Fashionfy Demo Integration API',
    customfavIcon: '👗',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #6366f1; }
      .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 5px; }
    `,
    swaggerOptions: {
      persistAuthorization: true, // Keep JWT token after page refresh
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  });

  await app.listen(port);
  console.log(`🚀 Fashionfy Demo Integration API is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger docs available at: http://localhost:${port}/api/docs`,
  );
  console.log(
    `🔐 Authentication endpoints: /auth/sign-in, /auth/sign-in-verify`,
  );
  console.log(
    `📁 File storage endpoints: /api/s3/presigned-upload-url`,
  );
  console.log(
    `🕷️ Crawling endpoints: /crawling/gentle-monster-glasses`,
  );
  console.log(
    `🎨 ComfyUI endpoints: /api/comfyui/image2image, /api/comfyui/health`,
  );
  console.log(
    `👕 FASHN endpoints: /api/fashn/tryon, /api/fashn/history`,
  );
  console.log(
    `👔 Clothes endpoints: /api/clothes, /api/clothes/types/:type`,
  );
  console.log(
    `💡 Make sure to set HF_TOKEN, COMFY_URL, and FASHN_API_KEY environment variables`,
  );

  // Log environment status
  const hfToken = configService.get<string>('HF_TOKEN');
  if (hfToken) {
    console.log(`✅ HF_TOKEN is configured (${hfToken.substring(0, 8)}...)`);
  } else {
    console.log(`❌ HF_TOKEN is not set - please add it to your .env file`);
  }

  const fashnApiKey = configService.get<string>('FASHN_API_KEY');
  if (fashnApiKey) {
    console.log(`✅ FASHN_API_KEY is configured (${fashnApiKey.substring(0, 8)}...)`);
  } else {
    console.log(`❌ FASHN_API_KEY is not set - please add it to your .env file`);
  }
}
bootstrap();
