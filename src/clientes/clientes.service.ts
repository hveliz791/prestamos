import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Cliente } from './entities/cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(@InjectRepository(Cliente) private repo: Repository<Cliente>) {}

  create(dto: CreateClienteDto) {
    const cliente = this.repo.create(dto);
    return this.repo.save(cliente);
  }

  findAll(search?: string) {
    if (!search) return this.repo.find({ order: { id: 'DESC' } });
    return this.repo.find({
      where: [{ nombre: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }],
      order: { id: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }
}
