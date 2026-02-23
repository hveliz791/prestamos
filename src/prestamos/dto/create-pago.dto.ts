import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePagoDto {
  @IsIn(['MENSUAL', 'QUINCENAL'])
  tipoPago: 'MENSUAL' | 'QUINCENAL';

  @IsNumber()
  @Min(0.01)
  montoPagado: number;

  @IsOptional()
  @IsString()
  nota?: string;
}
