import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@mail.com',
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'password123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72) // recomendado para bcrypt (antes de hash)
  password!: string;

  @ApiProperty({
    example: 'Pablo',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({
    example: 'Salut',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;
}
