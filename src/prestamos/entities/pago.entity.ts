import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Prestamo } from './prestamo.entity';

export type TipoPago = 'MENSUAL' | 'QUINCENAL';

@Entity('pagos')
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Prestamo, (p) => p.pagos, { onDelete: 'CASCADE' })
  prestamo: Prestamo;

  @Column({ type: 'varchar', length: 20 })
  tipoPago: TipoPago;

  @Column('numeric', { precision: 12, scale: 2 })
  montoPagado: number;

  @Column('numeric', { precision: 12, scale: 2 })
  saldoAnterior: number;

  @Column('numeric', { precision: 12, scale: 2 })
  saldoNuevo: number;

  @Column({ type: 'text', nullable: true })
  nota: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
