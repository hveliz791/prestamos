import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type UserRole = 'ADMIN' | 'COBRADOR';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  nombre: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, default: 'COBRADOR' })
  rol: UserRole;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
  password: string;
}