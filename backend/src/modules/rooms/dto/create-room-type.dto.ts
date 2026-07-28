import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateRoomTypeDto {
  @ApiProperty({ example: 'Suite Deluxe' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @IsNotEmpty()
  prixBase: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @IsNotEmpty()
  capacite: number;
}
