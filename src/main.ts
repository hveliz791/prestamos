import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Si estás detrás de proxy (muy común en deploy)
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // ✅ CORS seguro: solo tu frontend
  const allowlist = ['https://pres-roan.vercel.app'];

  app.enableCors({
    origin: (origin, cb) => {
      // Permite Postman/curl (sin Origin)
      if (!origin) return cb(null, true);

      if (allowlist.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'), false);
    },
    credentials: false, // ✅ usas Bearer token (no cookies)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ✅ Validación más estricta
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();