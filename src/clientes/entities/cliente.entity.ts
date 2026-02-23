import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('clientes')
export class Cliente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 150, unique: true })
  email: string;

  // ✅ IMPORTANTE: string | null (NO object, NO any)
  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  dpi: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
