import { Controller, Get, Param, ParseIntPipe, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('clientes')
export class ClientesController {
  constructor(private service: ClientesService) {}

  @Post()
  create(@Body() dto: CreateClienteDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.service.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }
}
