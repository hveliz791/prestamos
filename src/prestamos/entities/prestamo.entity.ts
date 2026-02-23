import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Cliente } from '../../clientes/entities/cliente.entity';
import { Pago } from './pago.entity';

export type TipoPlan = 'MENSUAL' | 'QUINCENAL';
export type EstadoPrestamo = 'ACTIVO' | 'EN_MORA' | 'PAGADO';

@Entity('prestamos')
export class Prestamo {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Cliente, { eager: true, onDelete: 'RESTRICT' })
  cliente: Cliente;

  @Column('numeric', { precision: 12, scale: 2 })
  montoPrincipal: number;

  @Column('numeric', { precision: 8, scale: 2 })
  tasaInteresMensual: number; // % mensual (ej: 10 = 10%)

  @Column('int')
  mesesPlazo: number;

  @Column({ type: 'varchar', length: 20 })
  tipoPlan: TipoPlan;

  @Column('numeric', { precision: 12, scale: 2 })
  totalInteres: number;

  @Column('numeric', { precision: 12, scale: 2 })
  totalPagar: number;

  @Column('numeric', { precision: 12, scale: 2 })
  cuotaMensual: number;

  @Column('numeric', { precision: 12, scale: 2 })
  cuotaQuincenal: number;

  @Column('numeric', { precision: 12, scale: 2 })
  saldoActual: number;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVO' })
  estado: EstadoPrestamo;

  // ✅ NUEVO: fechas y gracia
  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fechaInicio: string; // YYYY-MM-DD

  @Column({ type: 'date', default: () => 'CURRENT_DATE' })
  fechaProximoPago: string; // YYYY-MM-DD

  @Column({ type: 'int', default: 0 })
  diasDeGracia: number;
  
  @OneToMany(() => Pago, (p) => p.prestamo)
  pagos: Pago[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
