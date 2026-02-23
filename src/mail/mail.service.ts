import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('MAIL_HOST'),
      port: Number(this.config.get('MAIL_PORT')),
      secure: false,
      auth: {
        user: this.config.get('MAIL_USER'),
        pass: this.config.get('MAIL_PASS'),
      },
    });
  }

  async enviarPagoRegistrado(params: {
    to: string;
    clienteNombre: string;
    prestamoId: number;
    tipoPago: string;
    montoPagado: number;
    saldoAnterior: number;
    saldoNuevo: number;
    estado: string;

    // ✅ NUEVO (opcional)
    attachmentPdf?: {
      filename: string;
      content: Buffer;
    };
  }) {
    const from = this.config.get('MAIL_FROM') || this.config.get('MAIL_USER');

    const html = `
      <h3>Pago registrado</h3>
      <p><b>Cliente:</b> ${params.clienteNombre}</p>
      <p><b>Préstamo:</b> #${params.prestamoId}</p>
      <p><b>Tipo de pago:</b> ${params.tipoPago}</p>
      <p><b>Monto pagado:</b> Q ${Number(params.montoPagado).toFixed(2)}</p>
      <p><b>Saldo anterior:</b> Q ${Number(params.saldoAnterior).toFixed(2)}</p>
      <p><b>Saldo nuevo:</b> Q ${Number(params.saldoNuevo).toFixed(2)}</p>
      <p><b>Estado:</b> ${params.estado}</p>
      <p>Adjunto encontrarás tu recibo en PDF.</p>
    `;

    const attachments: any[] = [];

    if (params.attachmentPdf) {
      attachments.push({
        filename: params.attachmentPdf.filename,
        content: params.attachmentPdf.content,
        contentType: 'application/pdf',
      });
    }

    await this.transporter.sendMail({
      from,
      to: params.to,
      subject: `Pago registrado - Préstamo #${params.prestamoId}`,
      html,
      attachments: attachments.length ? attachments : undefined,
    });
  }
}
