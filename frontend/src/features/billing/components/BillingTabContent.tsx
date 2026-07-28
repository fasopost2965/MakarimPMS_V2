import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  listFoliosByStay,
  generateInvoice,
  addFolioLine,
  cancelFolioLine,
  createCreditNote,
} from "../api";
import { RecordPaymentDialog } from "@/features/payments/components/RecordPaymentDialog";
import type { Folio, InvoiceDetail } from "../types";
import {
  Plus,
  Printer,
  Trash2,
  CreditCard,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { InvoicePrintModal } from "./InvoicePrintModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TYPE_LIGNE_LABEL: Record<string, string> = {
  HEBERGEMENT: "Hébergement",
  EXTRA: "Extra",
  TAXE_SEJOUR: "Taxe de séjour",
  PAIEMENT: "Paiement",
  RESTAURATION: "Restauration",
};

const STATUT_FACTURE_LABEL: Record<string, string> = {
  EMISE: "Émise",
  ANNULEE_PAR_AVOIR: "Annulée par avoir",
};

export interface BillingTabContentProps {
  stayId: number;
}

export function BillingTabContent({ stayId }: BillingTabContentProps) {
  const [folios, setFolios] = useState<Folio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState<number | null>(
    null,
  );
  const [payingFolioId, setPayingFolioId] = useState<number | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<InvoiceDetail | null>(
    null,
  );

  // Dialog Add Line
  const [addingLineFolioId, setAddingLineFolioId] = useState<number | null>(
    null,
  );
  const [lineType, setLineType] = useState<"EXTRA" | "RESTAURATION">("EXTRA");
  const [lineLibelle, setLineLibelle] = useState("");
  const [lineMontant, setLineMontant] = useState("");
  const [sourceModule, setSourceModule] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [submittingLine, setSubmittingLine] = useState(false);

  // Dialog Cancel Line
  const [cancellingLine, setCancellingLine] = useState<{
    folioId: number;
    lineId: number;
  } | null>(null);
  const [cancelMotif, setCancelMotif] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Dialog Credit Note
  const [creditNoteInvoiceId, setCreditNoteInvoiceId] = useState<number | null>(
    null,
  );
  const [creditNoteMotif, setCreditNoteMotif] = useState("");
  const [submittingCreditNote, setSubmittingCreditNote] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFolios(await listFoliosByStay(stayId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [stayId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  async function handleGenerateInvoice(folioId: number) {
    setGeneratingInvoiceId(folioId);
    try {
      await generateInvoice(folioId);
      await refetch();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de génération de facture",
      );
    } finally {
      setGeneratingInvoiceId(null);
    }
  }

  async function handleAddLineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addingLineFolioId || !lineLibelle.trim() || !lineMontant.trim())
      return;
    setSubmittingLine(true);
    try {
      await addFolioLine(addingLineFolioId, {
        type: lineType,
        libelle: lineLibelle.trim(),
        montant: lineMontant.trim(),
        sourceModule: sourceModule.trim() || undefined,
        sourceRef: sourceRef.trim() || undefined,
      });
      setAddingLineFolioId(null);
      setLineLibelle("");
      setLineMontant("");
      setSourceModule("");
      setSourceRef("");
      await refetch();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'ajout de la ligne",
      );
    } finally {
      setSubmittingLine(false);
    }
  }

  async function handleCancelLineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cancellingLine || cancelMotif.trim().length < 5) return;
    setSubmittingCancel(true);
    try {
      await cancelFolioLine(
        cancellingLine.folioId,
        cancellingLine.lineId,
        cancelMotif.trim(),
      );
      setCancellingLine(null);
      setCancelMotif("");
      await refetch();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur d'annulation de ligne",
      );
    } finally {
      setSubmittingCancel(false);
    }
  }

  async function handleCreditNoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!creditNoteInvoiceId || creditNoteMotif.trim().length < 5) return;
    setSubmittingCreditNote(true);
    try {
      await createCreditNote(creditNoteInvoiceId, creditNoteMotif.trim());
      setCreditNoteInvoiceId(null);
      setCreditNoteMotif("");
      await refetch();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur de création d'avoir",
      );
    } finally {
      setSubmittingCreditNote(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Chargement…</p>;
  }

  if (error) {
    return (
      <div className="p-3 bg-destructive/10 text-destructive text-sm rounded flex items-center gap-2">
        <AlertCircle className="size-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (folios.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun folio pour ce séjour.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {folios.map((folio) => {
        const isClosed =
          folio.statut === "CLOTURE" || folio.stay?.statut === "CHECKOUT";

        // Totaux
        const totalCharges = folio.lignes
          .filter((l) => !l.annulee && l.type !== "PAIEMENT")
          .reduce((acc, l) => {
            let ligneTtc = Number(l.montant);
            if (l.type === "HEBERGEMENT") {
              ligneTtc = ligneTtc * 1.1;
            } else if (l.type === "EXTRA" || l.type === "RESTAURATION") {
              ligneTtc = ligneTtc * 1.2;
            }
            return acc + ligneTtc;
          }, 0);

        const totalPayments = folio.lignes
          .filter((l) => !l.annulee && l.type === "PAIEMENT")
          .reduce((acc, l) => acc + Number(l.montant), 0);

        const soldeDu = totalCharges - totalPayments;
        const hasActiveInvoice = folio.invoices.some(
          (i) => i.statut === "EMISE",
        );

        return (
          <div
            key={folio.id}
            className="rounded-lg border bg-card p-5 shadow-sm space-y-4"
          >
            {/* Header Folio */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-lg">{folio.libelle}</h3>
                <Badge
                  variant={isClosed ? "secondary" : "default"}
                  className="text-xs"
                >
                  {isClosed ? "CLÔTURÉ" : "OUVERT (Brouillon)"}
                </Badge>
              </div>

              {!isClosed && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAddingLineFolioId(folio.id);
                      setLineType("EXTRA");
                    }}
                    className="gap-1.5"
                  >
                    <Plus className="size-3.5" />
                    Ajouter charge
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setPayingFolioId(folio.id)}
                    className="gap-1.5"
                  >
                    <CreditCard className="size-3.5" />
                    Encaisser
                  </Button>
                </div>
              )}
            </div>

            {/* Resume Solde */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-md text-xs font-mono">
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase font-sans">
                  Total Charges (TTC)
                </span>
                <span className="font-bold text-sm text-foreground">
                  {totalCharges.toFixed(2)} MAD
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase font-sans">
                  Total Encaissé
                </span>
                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {totalPayments.toFixed(2)} MAD
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase font-sans">
                  Solde Dû
                </span>
                <span
                  className={`font-bold text-sm ${soldeDu > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-600"}`}
                >
                  {soldeDu.toFixed(2)} MAD
                </span>
              </div>
            </div>

            {/* Lignes du Folio */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Lignes d'imputation
              </span>
              <div className="divide-y border rounded-md bg-background overflow-hidden text-sm">
                {folio.lignes.length === 0 ? (
                  <p className="p-3 text-xs text-muted-foreground">
                    Aucune ligne d'imputation sur ce folio.
                  </p>
                ) : (
                  folio.lignes.map((ligne) => (
                    <div
                      key={ligne.id}
                      className={`flex items-center justify-between p-2.5 transition-colors ${
                        ligne.annulee
                          ? "bg-muted/40 line-through text-muted-foreground"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {TYPE_LIGNE_LABEL[ligne.type] || ligne.type} —{" "}
                            {ligne.libelle}
                          </span>
                          {ligne.sourceModule && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1 py-0"
                            >
                              {ligne.sourceModule}{" "}
                              {ligne.sourceRef ? `#${ligne.sourceRef}` : ""}
                            </Badge>
                          )}
                          {ligne.annulee && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] px-1 py-0"
                            >
                              Annulée ({ligne.motifAnnulation})
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono font-medium ${ligne.type === "PAIEMENT" ? "text-emerald-600" : ""}`}
                        >
                          {ligne.type === "PAIEMENT" ? "-" : ""}
                          {Number(ligne.montant).toFixed(2)} MAD
                          {ligne.type === "HEBERGEMENT" ||
                          ligne.type === "EXTRA" ||
                          ligne.type === "RESTAURATION" ? (
                            <span className="text-[10px] text-muted-foreground ml-1">
                              HT
                            </span>
                          ) : (
                            ""
                          )}
                        </span>

                        {!isClosed && !ligne.annulee && !hasActiveInvoice && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Annuler cette ligne"
                            onClick={() =>
                              setCancellingLine({
                                folioId: folio.id,
                                lineId: ligne.id,
                              })
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Section Facturation */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Factures Fiscale
                </span>
                {folio.invoices.length === 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleGenerateInvoice(folio.id)}
                    disabled={generatingInvoiceId === folio.id}
                    className="gap-1.5"
                  >
                    <FileCheck className="size-3.5" />
                    Générer la facture
                  </Button>
                )}
              </div>

              {folio.invoices.length > 0 && (
                <div className="space-y-2">
                  {folio.invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-slate-50 dark:bg-slate-900 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono font-bold text-sm">
                          {invoice.numero}
                        </span>
                        <Badge
                          variant={
                            invoice.statut === "EMISE" ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {STATUT_FACTURE_LABEL[invoice.statut] ||
                            invoice.statut}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                        <span className="font-mono text-sm font-semibold mr-auto sm:mr-0">
                          {Number(invoice.montantTotal).toFixed(2)} MAD
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setPrintingInvoice({ ...invoice, folio })
                          }
                          className="gap-1.5"
                        >
                          <Printer className="size-3.5" />
                          Imprimer
                        </Button>

                        {!isClosed && invoice.statut === "EMISE" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setCreditNoteInvoiceId(invoice.id)}
                          >
                            Émettre un avoir
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Modal Ajout Charge */}
      {addingLineFolioId !== null && (
        <Dialog open onOpenChange={() => setAddingLineFolioId(null)}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleAddLineSubmit}>
              <DialogHeader>
                <DialogTitle>Ajouter une charge au folio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Type de charge</Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    value={lineType}
                    onChange={(e) =>
                      setLineType(e.target.value as "EXTRA" | "RESTAURATION")
                    }
                  >
                    <option value="EXTRA">Extra / Service</option>
                    <option value="RESTAURATION">Restauration / Bar</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Libellé de la prestation *</Label>
                  <Input
                    placeholder="ex. Petit-déjeuner buffet, Consommation Bar Pool..."
                    value={lineLibelle}
                    onChange={(e) => setLineLibelle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Montant (MAD) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={lineMontant}
                    onChange={(e) => setLineMontant(e.target.value)}
                    required
                  />
                </div>

                {lineType === "RESTAURATION" && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Module source</Label>
                      <Input
                        placeholder="RESTAURANT"
                        value={sourceModule}
                        onChange={(e) => setSourceModule(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Réf. commande</Label>
                      <Input
                        placeholder="CMD-1042"
                        value={sourceRef}
                        onChange={(e) => setSourceRef(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAddingLineFolioId(null)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={submittingLine}>
                  {submittingLine ? "Ajout..." : "Imputer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Annulation Ligne */}
      {cancellingLine !== null && (
        <Dialog open onOpenChange={() => setCancellingLine(null)}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCancelLineSubmit}>
              <DialogHeader>
                <DialogTitle>Annuler la ligne de folio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Cette opération annulera la charge du folio avec traçabilité
                  dans l'historique d'audit.
                </p>
                <div className="space-y-2">
                  <Label>Motif d'annulation (min. 5 car.) *</Label>
                  <Input
                    placeholder="ex. Erreur de saisie, Offert par la direction..."
                    value={cancelMotif}
                    onChange={(e) => setCancelMotif(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancellingLine(null)}
                >
                  Retour
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={submittingCancel || cancelMotif.trim().length < 5}
                >
                  {submittingCancel
                    ? "Annulation..."
                    : "Confirmer l'annulation"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Avoir (Credit Note) */}
      {creditNoteInvoiceId !== null && (
        <Dialog open onOpenChange={() => setCreditNoteInvoiceId(null)}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCreditNoteSubmit}>
              <DialogHeader>
                <DialogTitle>Émettre un avoir total</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  L'avoir annule la facture fiscale émise et permet de réémettre
                  une facture corrigée sur ce même folio.
                </p>
                <div className="space-y-2">
                  <Label>Motif de l'avoir *</Label>
                  <Input
                    placeholder="ex. Erreur d'exonération de taxe, Rectification nom..."
                    value={creditNoteMotif}
                    onChange={(e) => setCreditNoteMotif(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreditNoteInvoiceId(null)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={
                    submittingCreditNote || creditNoteMotif.trim().length < 5
                  }
                >
                  {submittingCreditNote ? "Émission..." : "Émettre l'avoir"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {payingFolioId !== null && (
        <RecordPaymentDialog
          open
          folioId={payingFolioId}
          onClose={() => setPayingFolioId(null)}
          onRecorded={() => {
            setPayingFolioId(null);
            void refetch();
          }}
        />
      )}

      <InvoicePrintModal
        open={!!printingInvoice}
        onClose={() => setPrintingInvoice(null)}
        invoice={printingInvoice}
      />
    </div>
  );
}
