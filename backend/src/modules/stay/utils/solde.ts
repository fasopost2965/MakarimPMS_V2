import { Prisma, TypeLigneFolio } from '@prisma/client';

interface FolioLineLike {
  type: TypeLigneFolio;
  montant: Prisma.Decimal;
  annulee: boolean;
}

interface FolioLike {
  lignes: FolioLineLike[];
}

// Solde dû = somme des charges TTC (HEBERGEMENT/EXTRA/TAXE_SEJOUR) moins les
// paiements déjà enregistrés, lignes annulées ignorées. Aucun autre module
// ne doit recalculer ce solde autrement.
export function computeSoldeDu(folios: FolioLike[]): Prisma.Decimal {
  return folios.reduce(
    (total, folio) =>
      folio.lignes.reduce((sousTotal, ligne) => {
        if (ligne.annulee) return sousTotal;
        if (ligne.type === TypeLigneFolio.PAIEMENT) {
          return sousTotal.sub(ligne.montant);
        }

        let ligneTtc = new Prisma.Decimal(ligne.montant);
        // Appliquer la TVA par défaut pour le calcul du solde
        if (ligne.type === TypeLigneFolio.HEBERGEMENT) {
          ligneTtc = ligneTtc.mul(1.10);
        } else if (ligne.type === TypeLigneFolio.EXTRA || ligne.type === TypeLigneFolio.RESTAURATION) {
          ligneTtc = ligneTtc.mul(1.20);
        }
        
        return sousTotal.add(ligneTtc);
      }, total),
    new Prisma.Decimal(0),
  );
}
