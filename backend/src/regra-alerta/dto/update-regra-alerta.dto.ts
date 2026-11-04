import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRegraAlertaDto } from './create-regra-alerta.dto.js';

export class UpdateRegraAlertaDto extends CreateRegraAlertaDto {
  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}
