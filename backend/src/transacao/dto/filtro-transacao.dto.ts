import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

export class FiltroTransacaoDto {
  @IsOptional()
  @IsISO8601()
  de?: string;

  @IsOptional()
  @IsISO8601()
  ate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoriaId?: number;

  @IsOptional()
  @IsIn(['DEBIT', 'CREDIT'])
  tipo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
