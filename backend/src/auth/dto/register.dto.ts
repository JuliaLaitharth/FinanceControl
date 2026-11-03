import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Informe o nome' })
  nome!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'A senha deve conter letras e números' })
  senha!: string;
}