import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import { Pago } from './entities/pago.entity';
import { Prestamo } from './entities/prestamo.entity';

@Injectable()
export class RecibosService {
  constructor(
    @InjectRepository(Pago) private pagosRepo: Repository<Pago>,
    @InjectRepository(Prestamo) private prestamosRepo: Repository<Prestamo>,
  ) {}

  async generarReciboPago(prestamoId: number, pagoId: number): Promise<Buffer> {
    // Traer pago + prestamo + cliente
    const pago = await this.pagosRepo.findOne({
      where: { id: pagoId, prestamo: { id: prestamoId } },
      relations: { prestamo: true },
    });
    if (!pago) throw new NotFoundException('Pago no existe');

    // prestamo ya trae cliente porque tu Prestamo tiene eager:true
    const prestamo = pago.prestamo;
    if (!prestamo) throw new NotFoundException('Préstamo no existe');

    const cliente = prestamo.cliente;

    // Crear PDF en memoria (buffer)
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: any[] = [];
    doc.on('data', (c) => chunks.push(c));

    const endPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // ---- Contenido del PDF ----
    doc.fontSize(18).text('RECIBO DE PAGO', { align: 'center' });
    doc.moveDown(0.8);

    doc.fontSize(11).text(`Empresa:Préstamos`);
    doc.text(`Fecha: ${new Date(pago.createdAt).toLocaleString()}`);
    doc.text(`Recibo No.: ${pago.id}`);
    doc.text(`Préstamo No.: ${prestamo.id}`);
    doc.moveDown(0.8);

    doc.fontSize(12).text('DATOS DEL CLIENTE', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11).text(`Nombre: ${cliente?.nombre ?? 'N/A'}`);
    doc.text(`Email: ${cliente?.email ?? 'N/A'}`);
    doc.text(`Teléfono: ${cliente?.telefono ?? 'N/A'}`);
    doc.text(`DPI: ${cliente?.dpi ?? 'N/A'}`);
    doc.moveDown(0.8);

    doc.fontSize(12).text('DETALLE DEL PAGO', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(11).text(`Tipo de pago: ${pago.tipoPago}`);
    doc.text(`Monto pagado: Q ${Number(pago.montoPagado).toFixed(2)}`);
    doc.text(`Saldo anterior: Q ${Number(pago.saldoAnterior).toFixed(2)}`);
    doc.text(`Saldo nuevo: Q ${Number(pago.saldoNuevo).toFixed(2)}`);
    doc.text(`Estado del préstamo: ${prestamo.estado}`);
    doc.text(`Próximo pago: ${prestamo.fechaProximoPago ?? 'N/A'}`);
    doc.moveDown(0.8);

    if (pago.nota) {
      doc.fontSize(12).text('NOTA', { underline: true });
      doc.moveDown(0.4);
      doc.fontSize(11).text(pago.nota);
      doc.moveDown(0.8);
    }

    doc.moveDown(1.2);
    doc.fontSize(10).text('Gracias por su pago.', { align: 'center' });

    doc.end();
    return endPromise;
  }
}
