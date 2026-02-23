import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prestamo } from './entities/prestamo.entity';
import { Pago } from './entities/pago.entity';
import { CreatePrestamoDto } from './dto/create-prestamo.dto';
import { CreatePagoDto } from './dto/create-pago.dto';
import { Cliente } from '../clientes/entities/cliente.entity';
import { MailService } from '../mail/mail.service';
import { RecibosService } from './recibos.service';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// ✅ Helpers de fechas (date-only)
function toDateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateOnly(d);
}

function addMonths(dateStr: string, months: number) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setMonth(d.getMonth() + months);
  return toDateOnly(d);
}

function nextDueDate(fechaInicio: string, tipoPlan: 'MENSUAL' | 'QUINCENAL') {
  return tipoPlan === 'QUINCENAL' ? addDays(fechaInicio, 15) : addMonths(fechaInicio, 1);
}

@Injectable()
export class PrestamosService {
  constructor(
    @InjectRepository(Prestamo) private prestamosRepo: Repository<Prestamo>,
    @InjectRepository(Pago) private pagosRepo: Repository<Pago>,
    @InjectRepository(Cliente) private clientesRepo: Repository<Cliente>,
    private mail: MailService,
    private recibos: RecibosService,
  ) {}

  async crearPrestamo(dto: CreatePrestamoDto) {
    const cliente = await this.clientesRepo.findOne({ where: { id: dto.clienteId } });
    if (!cliente) throw new NotFoundException('Cliente no existe');

    // ✅ fechas por defecto
    const fechaInicio = dto.fechaInicio ? dto.fechaInicio.slice(0, 10) : toDateOnly(new Date());
    const diasDeGracia = dto.diasDeGracia ?? 0;
    const fechaProximoPago = nextDueDate(fechaInicio, dto.tipoPlan);

    // interés simple: principal * (tasa/100) * meses
    const interesTotal = round2(dto.montoPrincipal * (dto.tasaInteresMensual / 100) * dto.mesesPlazo);
    const totalPagar = round2(dto.montoPrincipal + interesTotal);

    const cuotaMensual = round2(totalPagar / dto.mesesPlazo);
    const cuotaQuincenal = round2(totalPagar / (dto.mesesPlazo * 2));

    const prestamo = this.prestamosRepo.create({
      cliente,
      montoPrincipal: dto.montoPrincipal,
      tasaInteresMensual: dto.tasaInteresMensual,
      mesesPlazo: dto.mesesPlazo,
      tipoPlan: dto.tipoPlan,
      totalInteres: interesTotal,
      totalPagar,
      cuotaMensual,
      cuotaQuincenal,
      saldoActual: totalPagar,
      estado: 'ACTIVO',

      // ✅ NUEVO
      fechaInicio,
      fechaProximoPago,
      diasDeGracia,
    });

    return this.prestamosRepo.save(prestamo);
  }

  async obtenerPrestamo(id: number) {
    const p = await this.prestamosRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Préstamo no existe');
    return p;
  }

  async listarPrestamos(clienteId?: number) {
    if (!clienteId) return this.prestamosRepo.find({ order: { id: 'DESC' } });
    return this.prestamosRepo.find({ where: { cliente: { id: clienteId } }, order: { id: 'DESC' } });
  }

  async listarPagos(prestamoId: number) {
    const p = await this.prestamosRepo.findOne({ where: { id: prestamoId } });
    if (!p) throw new NotFoundException('Préstamo no existe');
    return this.pagosRepo.find({ where: { prestamo: { id: prestamoId } }, order: { id: 'DESC' } });
  }

  async registrarPago(prestamoId: number, dto: CreatePagoDto) {
    const prestamo = await this.prestamosRepo.findOne({ where: { id: prestamoId } });
    if (!prestamo) throw new NotFoundException('Préstamo no existe');
    if (prestamo.estado === 'PAGADO') throw new BadRequestException('El préstamo ya está pagado');

    const saldoAnterior = Number(prestamo.saldoActual);
    const monto = round2(dto.montoPagado);

    if (monto <= 0) throw new BadRequestException('Monto inválido');
    if (monto > saldoAnterior) throw new BadRequestException('El monto no puede ser mayor al saldo');

    const saldoNuevo = round2(saldoAnterior - monto);

    // ✅ actualizar saldo, estado y próxima fecha
    prestamo.saldoActual = saldoNuevo;

    if (saldoNuevo === 0) {
      prestamo.estado = 'PAGADO';
    } else {
      const base = prestamo.fechaProximoPago || prestamo.fechaInicio;

      prestamo.fechaProximoPago =
        dto.tipoPago === 'QUINCENAL' ? addDays(base, 15) : addMonths(base, 1);

      const hoy = toDateOnly(new Date());
      prestamo.estado =
        hoy > addDays(prestamo.fechaProximoPago, prestamo.diasDeGracia || 0)
          ? 'EN_MORA'
          : 'ACTIVO';
    }

    await this.prestamosRepo.save(prestamo);

    // ✅ guardar pago
    const pago = this.pagosRepo.create({
      prestamo,
      tipoPago: dto.tipoPago,
      montoPagado: monto,
      saldoAnterior,
      saldoNuevo,
      nota: dto.nota ?? null,
    });
    const pagoGuardado = await this.pagosRepo.save(pago);

    // ✅ enviar correo + adjuntar PDF
    const cliente = prestamo.cliente; // eager true
    if (cliente?.email) {
      const pdf = await this.recibos.generarReciboPago(prestamo.id, pagoGuardado.id);

      await this.mail.enviarPagoRegistrado({
        to: cliente.email,
        clienteNombre: cliente.nombre,
        prestamoId: prestamo.id,
        tipoPago: dto.tipoPago,
        montoPagado: monto,
        saldoAnterior,
        saldoNuevo,
        estado: prestamo.estado,
        attachmentPdf: {
          filename: `recibo-pago-${pagoGuardado.id}.pdf`,
          content: pdf,
        },
      });
    }

    return {
      prestamo,
      pago: pagoGuardado,
      correoEnviado: Boolean(cliente?.email),
    };
  }

  async listarMora() {
    const activos = await this.prestamosRepo.find({ where: { estado: 'ACTIVO' } });

    for (const p of activos) {
      const hoy = toDateOnly(new Date());
      const limite = addDays(p.fechaProximoPago, p.diasDeGracia || 0);

      if (hoy > limite) {
        p.estado = 'EN_MORA';
        await this.prestamosRepo.save(p);
      }
    }

    return this.prestamosRepo.find({
      where: { estado: 'EN_MORA' },
      order: { id: 'DESC' },
    });
  }
}
