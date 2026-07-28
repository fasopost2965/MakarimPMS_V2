import { apiRequest } from "@/lib/api-client";
import type { CreditNote, Folio, Invoice, InvoiceDetail } from "./types";

export function listFoliosByStay(stayId: number) {
  return apiRequest<Folio[]>(`/stays/${stayId}/folios`);
}

export function listAllFolios() {
  return apiRequest<Folio[]>("/folios");
}

export function getFolio(folioId: number) {
  return apiRequest<Folio>(`/folios/${folioId}`);
}

export function getInvoice(invoiceId: number) {
  return apiRequest<Invoice>(`/invoices/${invoiceId}`);
}

export function generateInvoice(folioId: number) {
  return apiRequest<Invoice>(`/invoices/generer?folioId=${folioId}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function listInvoices() {
  return apiRequest<InvoiceDetail[]>("/invoices");
}

export function addFolioLine(
  folioId: number,
  data: {
    type: "HEBERGEMENT" | "EXTRA" | "RESTAURATION";
    libelle: string;
    montant: string;
    sourceModule?: string;
    sourceRef?: string;
  },
) {
  return apiRequest<unknown>(`/folios/${folioId}/lignes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function cancelFolioLine(
  folioId: number,
  lineId: number,
  motif: string,
) {
  return apiRequest<unknown>(`/folios/${folioId}/lignes/${lineId}/annuler`, {
    method: "PATCH",
    body: JSON.stringify({ motif }),
  });
}

export function excludeFolioTaxes(
  folioId: number,
  taxeIds: number[],
  motif: string,
) {
  return apiRequest<unknown>(`/folios/${folioId}/taxes-exclues`, {
    method: "PATCH",
    body: JSON.stringify({ taxeIds, motif }),
  });
}

export function createCreditNote(invoiceId: number, motif: string) {
  return apiRequest<CreditNote>(`/invoices/${invoiceId}/credit-notes`, {
    method: "POST",
    body: JSON.stringify({ motif }),
  });
}
