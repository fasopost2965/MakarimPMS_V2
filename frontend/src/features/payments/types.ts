export type MoyenPaiement = "ESPECES" | "CARTE" | "VIREMENT" | "ACOMPTE";

export interface Payment {
  id: number;
  folioId: number;
  invoiceId: number | null;
  moyen: MoyenPaiement;
  montant: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface CreatePaymentInput {
  folioId: number;
  invoiceId?: number;
  moyen: MoyenPaiement;
  montant: string;
  idempotencyKey: string;
}

export interface PaymentDetail extends Payment {
  folio?: {
    stay?: {
      room?: { numero: string };
      guest?: { nom: string; prenom: string };
    };
  };
}
