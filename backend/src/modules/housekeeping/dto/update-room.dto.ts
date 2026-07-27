import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateRoomDto {
  @ApiPropertyOptional({ example: '101' })
  @IsString()
  @IsOptional()
  numero?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  roomTypeId?: number;

  @ApiPropertyOptional({ example: 'LIBRE_PROPRE' })
  @IsString()
  @IsOptional()
  statut?: any;
}
