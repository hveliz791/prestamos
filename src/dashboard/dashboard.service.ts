import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prestamo } from '../prestamos/entities/prestamo.entity';
import { Pago } from '../prestamos/entities/pago.entity';

function n(v: any) {
  return Number(v ?? 0);
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Prestamo) private prestamosRepo: Repository<Prestamo>,
    @InjectRepository(Pago) private pagosRepo: Repository<Pago>,
  ) {}

  async resumen() {
    // Totales de préstamos
    const prestamosAgg = await this.prestamosRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.montoPrincipal), 0)', 'totalPrestado')
      .addSelect('COALESCE(SUM(p.totalInteres), 0)', 'totalInteres')
      .addSelect('COALESCE(SUM(p.totalPagar), 0)', 'totalARecuperar')
      .addSelect('COALESCE(SUM(p.saldoActual), 0)', 'totalPendiente')
      .addSelect('COUNT(*)', 'cantidadPrestamos')
      .getRawOne();

    // Conteo por estado
    const activos = await this.prestamosRepo.count({ where: { estado: 'ACTIVO' } });
    const pagados = await this.prestamosRepo.count({ where: { estado: 'PAGADO' } });
    const mora = await this.prestamosRepo.count({ where: { estado: 'EN_MORA' } });

    // Total cobrado = suma de pagos
    const pagosAgg = await this.pagosRepo
      .createQueryBuilder('pg')
      .select('COALESCE(SUM(pg.montoPagado), 0)', 'totalCobrado')
      .addSelect('COUNT(*)', 'cantidadPagos')
      .getRawOne();

    // Últimos pagos
    const ultimosPagos = await this.pagosRepo.find({
      order: { id: 'DESC' },
      take: 10,
      relations: { prestamo: true }, // prestamo trae cliente porque prestamo tiene eager:true en cliente
    });

    // Últimos préstamos
    const ultimosPrestamos = await this.prestamosRepo.find({
      order: { id: 'DESC' },
      take: 10,
    });

    return {
      cards: {
        totalPrestado: n(prestamosAgg.totalPrestado),
        totalInteres: n(prestamosAgg.totalInteres),
        totalARecuperar: n(prestamosAgg.totalARecuperar),
        totalCobrado: n(pagosAgg.totalCobrado),
        totalPendiente: n(prestamosAgg.totalPendiente),
        cantidadPrestamos: n(prestamosAgg.cantidadPrestamos),
        cantidadPagos: n(pagosAgg.cantidadPagos),
        prestamosActivos: activos,
        prestamosPagados: pagados,
        prestamosEnMora: mora, // ✅ NUEVO
      },
      ultimosPagos: ultimosPagos.map((x) => ({
        id: x.id,
        createdAt: x.createdAt,
        tipoPago: x.tipoPago,
        montoPagado: Number(x.montoPagado),
        saldoNuevo: Number(x.saldoNuevo),
        prestamoId: x.prestamo?.id,
        clienteNombre: x.prestamo?.cliente?.nombre ?? null,
      })),
      ultimosPrestamos: ultimosPrestamos.map((p) => ({
        id: p.id,
        createdAt: p.createdAt,
        estado: p.estado,
        tipoPlan: p.tipoPlan,
        totalPagar: Number(p.totalPagar),
        saldoActual: Number(p.saldoActual),
        clienteNombre: p.cliente?.nombre ?? null,
      })),
    };
  }
}
