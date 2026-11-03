import { IsBoolean } from 'class-validator';

export class BiometriaDto {
  @IsBoolean()
  ativa!: boolean;
}