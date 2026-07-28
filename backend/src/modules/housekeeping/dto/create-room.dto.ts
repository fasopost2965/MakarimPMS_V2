import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: '101' })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  roomTypeId: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  etage?: number;
}
