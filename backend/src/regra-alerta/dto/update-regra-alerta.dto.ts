import { IsBoolean, IsOptional } from 'class-validator';
import { CreateRegraAlertaDto } from './create-regra-alerta.dto.js';

export class UpdateRegraAlertaDto extends (
  class extends CreateRegraAlertaDto {
    override tipoEvento!: string;
    override canal!: string;
  }
) {
  @IsOptional()
  @IsBoolean()
  ativa?: boolean;
}
