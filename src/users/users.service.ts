import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(params: { nombre: string; email: string; password: string; rol?: UserRole }) {
    const exists = await this.repo.findOne({ where: { email: params.email } });
    if (exists) throw new BadRequestException('Ya existe un usuario con ese email');

    const passwordHash = await bcrypt.hash(params.password, 10);

    const user = this.repo.create({
      nombre: params.nombre,
      email: params.email.toLowerCase(),
      rol: params.rol ?? 'COBRADOR',
      passwordHash,
      activo: true,
    });

    const saved = await this.repo.save(user);
    const { passwordHash: _, ...safe } = saved as any;
    return safe;
  }

  async findByEmail(email: string) {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  async findAll() {
    const users = await this.repo.find({ order: { id: 'DESC' } });
    return users.map(({ passwordHash, ...rest }) => rest);
  }

  async toggleActivo(id: number, activo: boolean) {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('Usuario no existe');
    u.activo = activo;
    const saved = await this.repo.save(u);
    const { passwordHash, ...rest } = saved as any;
    return rest;
  }

async resetPassword(id: number, newPassword: string) {
  if (!newPassword || newPassword.length < 6) {
    throw new BadRequestException('Contraseña inválida (mínimo 6 caracteres)');
  }

  const user = await this.repo.findOne({ where: { id } });
  if (!user) throw new NotFoundException('Usuario no existe');

  user.password = await bcrypt.hash(newPassword, 10);
  await this.repo.save(user);

  return { ok: true };
}
}