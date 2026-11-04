import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConsentimentoDto {
  /** itemId retornado pelo Pluggy Connect Widget após autorização do usuário. */
  @IsString()
  @IsNotEmpty({ message: 'itemId é obrigatório' })
  itemId!: string;

  /** Nome da instituição exibido no widget (opcional — será buscado na API). */
  @IsString()
  @IsOptional()
  nomeInstituicao?: string;

  /** Código Pluggy da instituição (connectorId). */
  @IsString()
  @IsOptional()
  codigoPluggy?: string;
}
