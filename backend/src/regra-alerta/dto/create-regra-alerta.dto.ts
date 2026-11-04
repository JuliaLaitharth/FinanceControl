import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateRegraAlertaDto {
  @IsIn(['SALDO_MINIMO', 'TRANSACAO_GRANDE', 'DESPESA_CATEGORIA'])
  tipoEvento!: string;

  @IsOptional()
  @IsIn(['MENOR_QUE', 'MAIOR_QUE'])
  operador?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  valorLimite?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoriaId?: number;

  @IsIn(['PUSH', 'EMAIL', 'AMBOS'])
  canal!: string;
}
