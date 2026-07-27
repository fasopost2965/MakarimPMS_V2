import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: '101' })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsNotEmpty()
  roomTypeId: number;
}
