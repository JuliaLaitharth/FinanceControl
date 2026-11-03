import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Informe a senha' })
  senha!: string;
}