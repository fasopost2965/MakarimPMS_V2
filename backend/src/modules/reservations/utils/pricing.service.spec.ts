import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { calculateNightlyTotal, calculateFormuleTotal } from './pricing';
import { FormuleHebergement } from '@prisma/client';

describe('Pricing Utils & Seasonal Modifiers', () => {
  it('should calculate base nightly total when no season rate matches', () => {
    const nights = [new Date('2026-08-01'), new Date('2026-08-02')];
    const prixBase = new Prisma.Decimal(100);
    const seasonRates: Array<{
      dateDebut: Date;
      dateFin: Date;
      prixNuit: Prisma.Decimal;
    }> = [];

    const total = calculateNightlyTotal(nights, prixBase, seasonRates);
    expect(total.toNumber()).toBe(200);
  });

  it('should apply seasonal rates correctly when nights fall within date ranges', () => {
    const nights = [new Date('2026-08-01'), new Date('2026-08-05')];
    const prixBase = new Prisma.Decimal(100);
    const seasonRates = [
      {
        dateDebut: new Date('2026-08-04'),
        dateFin: new Date('2026-08-10'),
        prixNuit: new Prisma.Decimal(150),
      },
    ];

    const total = calculateNightlyTotal(nights, prixBase, seasonRates);
    // 1st night: 100 (base), 2nd night: 150 (season) -> Total: 250
    expect(total.toNumber()).toBe(250);
  });

  it('should calculate formule total correctly with capacities', () => {
    const roomType = {
      prixPetitDejeuner: new Prisma.Decimal(20),
      prixDemiPension: new Prisma.Decimal(50),
      prixPensionComplete: new Prisma.Decimal(80),
    };
    const nbNuits = 3;
    const nbPersonnes = 2;

    const formuleTotal = calculateFormuleTotal(
      FormuleHebergement.BED_AND_BREAKFAST,
      roomType,
      nbNuits,
      nbPersonnes,
    );
    // 20 * 2 * 3 = 120
    expect(formuleTotal.toNumber()).toBe(120);
  });
});
