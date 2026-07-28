import { IsDateString, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ShortenStayDto {
  @IsDateString()
  @IsNotEmpty()
  dateCheckoutPrevue: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10, {
    message: 'Le motif de l’écourtement doit contenir au moins 10 caractères.',
  })
  motif: string;
}
