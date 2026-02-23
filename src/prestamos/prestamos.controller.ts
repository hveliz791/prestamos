import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';

import { PrestamosService } from './prestamos.service';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';
import { CreatePagoDto } from './dto/create-pago.dto';
import { RecibosService } from './recibos.service';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('prestamos')
export class PrestamosController {
  constructor(
    private service: PrestamosService,
    private recibos: RecibosService,
  ) {}

  // ✅ SOLO ADMIN crea préstamos
  @Roles('ADMIN')
  @Post()
  crear(@Body() dto: CreatePrestamoDto) {
    return this.service.crearPrestamo(dto);
  }

  // ✅ ADMIN y COBRADOR pueden listar/ver
  @Roles('ADMIN', 'COBRADOR')
  @Get()
  listar(@Query('clienteId') clienteId?: string) {
    return this.service.listarPrestamos(clienteId ? Number(clienteId) : undefined);
  }

  // ✅ ADMIN y COBRADOR pueden ver morosos
  @Roles('ADMIN', 'COBRADOR')
  @Get('mora')
  listarMora() {
    return this.service.listarMora();
  }

  // ✅ ADMIN y COBRADOR pueden ver detalle
  @Roles('ADMIN', 'COBRADOR')
  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.service.obtenerPrestamo(id);
  }

  // ✅ ADMIN y COBRADOR pueden ver pagos
  @Roles('ADMIN', 'COBRADOR')
  @Get(':id/pagos')
  pagos(@Param('id', ParseIntPipe) id: number) {
    return this.service.listarPagos(id);
  }

  // ✅ ADMIN y COBRADOR pueden registrar pagos
  @Roles('ADMIN', 'COBRADOR')
  @Post(':id/pagos')
  pagar(@Param('id', ParseIntPipe) id: number, @Body() dto: CreatePagoDto) {
    return this.service.registrarPago(id, dto);
  }

  // ✅ ADMIN y COBRADOR pueden descargar recibo
  @Roles('ADMIN', 'COBRADOR')
  @Get(':id/pagos/:pagoId/recibo')
  async recibo(
    @Param('id', ParseIntPipe) id: number,
    @Param('pagoId', ParseIntPipe) pagoId: number,
    @Res() res: Response,
  ) {
    const pdf = await this.recibos.generarReciboPago(id, pagoId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="recibo-pago-${pagoId}.pdf"`);
    res.send(pdf);
  }
}