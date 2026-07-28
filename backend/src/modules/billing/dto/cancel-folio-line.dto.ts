import { IsString, MinLength } from 'class-validator';

export class CancelFolioLineDto {
  @IsString()
  @MinLength(5, { message: 'Le motif d’annulation doit contenir au moins 5 caractères.' })
  motif: string;
}
