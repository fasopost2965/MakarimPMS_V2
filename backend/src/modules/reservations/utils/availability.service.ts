import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ParametersService } from '../../parameters/parameters.service';
import { RoomsService } from '../../rooms/rooms.service';
import { getNightsBetween } from './nights';
import { CheckAvailabilityDto } from '../dto/check-availability.dto';
import {
  assertNoStopSale,
  findMinStayViolation,
  StopSaleViolation,
} from './rate-restrictions';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomsService: RoomsService,
    private readonly parametersService: ParametersService,
  ) {}

  private assertDateRangeValid(dateArrivee: string, dateDepart: string) {
    if (new Date(dateDepart) <= new Date(dateArrivee)) {
      throw new BadRequestException(
        'dateDepart doit être postérieure à dateArrivee.',
      );
    }
  }

  async assertRateRestrictionsSatisfied(
    tx: Prisma.TransactionClient | PrismaService,
    roomTypeId: number,
    dateArrivee: Date,
    nights: Date[],
  ) {
    const restrictions =
      await this.parametersService.getRateRestrictionsForRoomType(
        roomTypeId,
        tx as Prisma.TransactionClient,
      );

    try {
      assertNoStopSale(restrictions, nights);
    } catch (error) {
      if (error instanceof StopSaleViolation) {
        throw new ConflictException(error.message);
      }
      throw error;
    }

    const minStayRequis = findMinStayViolation(
      restrictions,
      dateArrivee,
      nights.length,
    );
    if (minStayRequis !== null) {
      throw new BadRequestException(
        `Séjour minimum de ${minStayRequis} nuit${minStayRequis > 1 ? 's' : ''} requis pour une arrivée à cette date.`,
      );
    }
  }

  async checkAvailability(
    prismaClient: PrismaService | Prisma.TransactionClient,
    dto: CheckAvailabilityDto,
  ) {
    this.assertDateRangeValid(dto.dateDebut, dto.dateFin);
    const nights = getNightsBetween(dto.dateDebut, dto.dateFin);

    const occupiedRoomIds = await prismaClient.roomNight.findMany({
      where: { date: { in: nights } },
      select: { roomId: true },
      distinct: ['roomId'],
    });
    const occupiedIds = new Set(occupiedRoomIds.map((r) => r.roomId));

    const allRooms = await this.roomsService.findAllWithType();
    return allRooms.filter(
      (room) =>
        !occupiedIds.has(room.id) &&
        (dto.roomTypeId === undefined || room.roomTypeId === dto.roomTypeId),
    );
  }
}
