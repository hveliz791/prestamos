import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ClientesModule } from './clientes/clientes.module';
import { PrestamosModule } from './prestamos/prestamos.module';
import { MailModule } from './mail/mail.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // ✅ Rate limiting (global suave; login lo haremos más estricto)
    ThrottlerModule.forRoot([
      {
        ttl: 60,   // 60 segundos
        limit: 20, // 20 requests/min por IP (global)
      },
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // en producción: false + migraciones
        extra: {
          ssl: { rejectUnauthorized: false },
        },
      }),
    }),

    MailModule,
    ClientesModule,
    PrestamosModule,
    DashboardModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    // ✅ Activa throttling global
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}