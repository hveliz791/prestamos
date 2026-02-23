import { Body, Controller, Get, Patch, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from './entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('users')
export class UsersController {
  constructor(private service: UsersService) {}

  @Post()
  create(@Body() body: { nombre: string; email: string; password: string; rol?: UserRole }) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id/activo')
  toggle(@Param('id', ParseIntPipe) id: number, @Body() body: { activo: boolean }) {
    return this.service.toggleActivo(id, body.activo);
  }

  @Patch(':id/password')
resetPassword(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: { password: string },
) {
  return this.service.resetPassword(id, body.password);
}
}