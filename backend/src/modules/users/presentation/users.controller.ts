import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { AdminOnly } from '../../../common/auth/auth.decorators.js';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto.js';
import { UsersService } from '../application/users.service.js';
import { CreateUserDto, UserResponseDto } from './dto/user.dto.js';
import { toUserResponse } from './user.mapper.js';

@ApiTags('users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ type: ErrorResponseDto })
@ApiForbiddenResponse({ type: ErrorResponseDto, description: 'Apenas o usuário admin.' })
@AdminOnly()
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os usuários (somente admin).' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async list(): Promise<UserResponseDto[]> {
    return (await this.users.list()).map(toUserResponse);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um usuário (somente admin).' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Username já existe.' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return toUserResponse(await this.users.create(dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um usuário (somente admin; o admin não pode ser removido).' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  @ApiUnprocessableEntityResponse({ type: ErrorResponseDto })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.users.remove(id);
  }
}
