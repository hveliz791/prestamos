import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePrestamoDto {
  @IsInt()
  clienteId: number;

  @IsNumber()
  @Min(0.01)
  montoPrincipal: number;

  @IsNumber()
  @Min(0)
  tasaInteresMensual: number; // %

  @IsInt()
  @Min(1)
  mesesPlazo: number;

  @IsIn(['MENSUAL', 'QUINCENAL'])
  tipoPlan: 'MENSUAL' | 'QUINCENAL';

  // ✅ NUEVO (opcional)
  @IsOptional()
  @IsDateString()
  fechaInicio?: string; // ejemplo: "2026-02-16"

  // ✅ NUEVO (opcional)
  @IsOptional()
  @IsInt()
  diasDeGracia?: number;
}
