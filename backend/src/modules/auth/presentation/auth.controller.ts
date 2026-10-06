import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { type AuthenticatedUser, CurrentUser, Public } from '../../../common/auth/auth.decorators.js';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto.js';
import type { EnvironmentVariables } from '../../../config/env.validation.js';
import { AuthService } from '../application/auth.service.js';
import { AuthUserDto, LoginDto, LoginResponseDto } from './dto/auth.dto.js';

@ApiTags('auth')
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica com username e senha e devolve um token de acesso.' })
  @ApiOkResponse({ type: LoginResponseDto })
  async login(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    const { accessToken, user } = await this.auth.login(dto.username, dto.password);
    return { accessToken, tokenType: 'Bearer', expiresIn: this.config.get('JWT_EXPIRES_IN', { infer: true }), user };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuário dono do token.' })
  @ApiOkResponse({ type: AuthUserDto })
  me(@CurrentUser() user: AuthenticatedUser): AuthUserDto {
    return user;
  }
}
