import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../../../common/dto/transforms.js';

export const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export class CreateUserDto {
  @ApiProperty({ minLength: 3, maxLength: 50, example: 'maria.perez', description: 'Letras, números, ".", "_" e "-".' })
  @Trim()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(USERNAME_PATTERN, { message: 'username deve conter apenas letras, números, ".", "_" ou "-"' })
  username: string;

  @ApiProperty({ minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password: string;
}

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ description: 'true apenas para o usuário "admin".' })
  isAdmin: boolean;

  @ApiProperty()
  createdAt: Date;
}
