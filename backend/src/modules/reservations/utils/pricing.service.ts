import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { FormuleHebergement, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ParametersService } from '../../parameters/parameters.service';
import { calculateFormuleTotal, calculateNightlyTotal } from './pricing';
import { getNightsBetween } from './nights';

@Injectable()
export class PricingService {
  constructor(private readonly parametersService: ParametersService) {}

  private assertDateRangeValid(dateArrivee: string, dateDepart: string) {
    if (new Date(dateDepart) <= new Date(dateArrivee)) {
      throw new BadRequestException(
        'dateDepart doit être postérieure à dateArrivee.',
      );
    }
  }

  async calculatePrixTotal(
    tx: Prisma.TransactionClient | PrismaService,
    roomTypeId: number,
    nights: Date[],
    formule: FormuleHebergement,
  ) {
    const roomType = await tx.roomType.findUnique({
      where: { id: roomTypeId },
    });
    if (!roomType) {
      throw new NotFoundException(`Type de chambre ${roomTypeId} introuvable.`);
    }
    const seasonRates = await this.parametersService.getSeasonRatesForRoomType(
      roomTypeId,
      tx as Prisma.TransactionClient,
    );
    const hebergement = calculateNightlyTotal(
      nights,
      roomType.prixBase,
      seasonRates,
    );
    const formuleTotal = calculateFormuleTotal(
      formule,
      roomType,
      nights.length,
      roomType.capacite,
    );
    return hebergement.add(formuleTotal);
  }

  async estimatePrixTotal(
    prismaClient: PrismaService,
    roomTypeId: number,
    dateArrivee: string,
    dateDepart: string,
    formule: FormuleHebergement = FormuleHebergement.BED_AND_BREAKFAST,
  ) {
    this.assertDateRangeValid(dateArrivee, dateDepart);
    const nights = getNightsBetween(dateArrivee, dateDepart);
    return this.calculatePrixTotal(prismaClient, roomTypeId, nights, formule);
  }
}
