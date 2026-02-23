import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @Length(2, 150)
  nombre: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  dpi?: string;
}

