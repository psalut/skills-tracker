import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'pablo@mail.com',
  })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: '12345678',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
