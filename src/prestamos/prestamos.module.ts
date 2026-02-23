import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prestamo } from './entities/prestamo.entity';
import { Pago } from './entities/pago.entity';
import { PrestamosController } from './prestamos.controller';
import { PrestamosService } from './prestamos.service';
import { ClientesModule } from '../clientes/clientes.module';
import { MailModule } from '../mail/mail.module';
import { RecibosService } from './recibos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prestamo, Pago]),
    ClientesModule,
    MailModule,
  ],
  controllers: [PrestamosController],
  providers: [PrestamosService, RecibosService],
})
export class PrestamosModule {}
