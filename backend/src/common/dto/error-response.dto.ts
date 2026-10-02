import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'NOT_FOUND', description: 'Código estável para tratamento no cliente.' })
  code: string;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional({ description: 'Detalhes extras, ex.: erros por linha na importação CSV.' })
  details?: unknown;
}
