export interface FolioLine {
  id: number;
  type: "HEBERGEMENT" | "EXTRA" | "TAXE_SEJOUR" | "PAIEMENT" | "RESTAURATION";
  libelle: string;
  montant: string;
  tauxTva: string;
  annulee: boolean;
  motifAnnulation?: string;
  sourceModule?: string;
  sourceRef?: string;
  createdAt: string;
}

export interface Invoice {
  id: number;
  numero: string;
  montantTotal: string;
  statut: "EMISE" | "ANNULEE_PAR_AVOIR";
  pdfUrl?: string;
  createdAt: string;
  creditNotes: CreditNote[];
  payments: Payment[];
}

export interface CreditNote {
  id: number;
  motif: string;
  montant: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  moyen: "ESPECES" | "CARTE" | "VIREMENT" | "ACOMPTE";
  montant: string;
  createdAt: string;
}

export interface Folio {
  id: number;
  stayId: number;
  libelle: string;
  statut?: "OUVERT" | "CLOTURE";
  soldeDu?: string;
  lignes: FolioLine[];
  invoices: Invoice[];
  createdAt: string;
  stay?: {
    id: number;
    statut: "EN_COURS" | "CHECKOUT";
    dateCheckin: string;
    dateCheckoutPrevue: string;
    dateCheckoutReelle?: string;
    room?: { id: number; numero: string };
    guest?: { id: number; nom: string; prenom: string; email?: string | null };
  };
}

// Extensions for the nested data returned by findAll endpoints
export interface InvoiceDetail extends Invoice {
  folio?: Folio;
}
