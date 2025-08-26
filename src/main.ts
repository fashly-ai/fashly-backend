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
    .setTitle('Portrait Sunglasses API')
    .setDescription(
      'AI-powered API to add stylish sunglasses to portrait photographs',
    )
    .setVersion('1.0')
    .addTag('image', 'Image processing endpoints')
    .addServer(`http://localhost:${port}`, 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Portrait Sunglasses API',
    customfavIcon: '🕶️',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(port);
  console.log(`🚀 Sunglasses API is running on: http://localhost:${port}`);
  console.log(
    `📚 Swagger docs available at: http://localhost:${port}/api/docs`,
  );
  console.log(
    `📸 Upload endpoint: http://localhost:${port}/api/image/add-sunglasses`,
  );
  console.log(
    `💡 Make sure to set HF_TOKEN environment variable for Hugging Face API`,
  );

  // Log environment status
  const hfToken = configService.get<string>('HF_TOKEN');
  if (hfToken) {
    console.log(`✅ HF_TOKEN is configured (${hfToken.substring(0, 8)}...)`);
  } else {
    console.log(`❌ HF_TOKEN is not set - please add it to your .env file`);
  }
}
bootstrap();
