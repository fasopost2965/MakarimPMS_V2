import { IsDecimal, IsEnum, IsOptional, IsString } from 'class-validator';
import { TypeLigneFolio } from '@prisma/client';

export class AddFolioLineDto {
  @IsEnum(TypeLigneFolio)
  type: TypeLigneFolio;

  @IsString()
  libelle: string;

  @IsDecimal({ decimal_digits: '1,2' })
  montant: string;

  @IsOptional()
  @IsString()
  sourceModule?: string;

  @IsOptional()
  @IsString()
  sourceRef?: string;
}
