import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Prestamo } from '../prestamos/entities/prestamo.entity';
import { Pago } from '../prestamos/entities/pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Prestamo, Pago])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
