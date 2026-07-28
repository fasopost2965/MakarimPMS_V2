import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateRoomTypeDto {
  @ApiPropertyOptional({ example: 'Suite Deluxe' })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiPropertyOptional({ example: 1300 })
  @IsNumber()
  @IsOptional()
  prixBase?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @IsOptional()
  capacite?: number;
}
