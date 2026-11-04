import { IsInt, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateRegraCategoriacaoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  palavra!: string;

  @IsInt()
  @Min(1)
  categoriaId!: number;
}
