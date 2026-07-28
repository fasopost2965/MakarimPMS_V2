import { useEffect, useState, useCallback, useMemo } from "react";
import { CreditCard, FileText, Printer, Search, Wallet } from "lucide-react";
import { listInvoices, listAllFolios } from "../api";
import type { InvoiceDetail, Folio } from "../types";
import { listPayments } from "../../payments/api";
import type { PaymentDetail } from "../../payments/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { InvoicePrintModal } from "../components/InvoicePrintModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BillingTabContent } from "../components/BillingTabContent";

export function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceDetail[]>([]);
  const [payments, setPayments] = useState<PaymentDetail[]>([]);
  const [folios, setFolios] = useState<Folio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("folios");
  const [printingInvoice, setPrintingInvoice] = useState<InvoiceDetail | null>(
    null,
  );
  const [selectedFolioStayId, setSelectedFolioStayId] = useState<number | null>(
    null,
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "factures") {
        const inv = await listInvoices();
        setInvoices(inv);
      } else if (activeTab === "paiements") {
        const pay = await listPayments();
        setPayments(pay);
      } else {
        const fol = await listAllFolios();
        setFolios(fol);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const filteredFolios = useMemo(() => {
    return folios.filter((fol) => {
      if (statusFilter !== "ALL" && fol.statut !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          fol.libelle.toLowerCase().includes(q) ||
          fol.stay?.guest?.nom?.toLowerCase().includes(q) ||
          fol.stay?.guest?.prenom?.toLowerCase().includes(q) ||
          fol.stay?.room?.numero?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [folios, search, statusFilter]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter !== "ALL" && inv.statut !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          inv.numero.toLowerCase().includes(q) ||
          inv.folio?.stay?.guest?.nom?.toLowerCase().includes(q) ||
          inv.folio?.stay?.guest?.prenom?.toLowerCase().includes(q) ||
          inv.folio?.stay?.room?.numero?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, search, statusFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      if (search) {
        const q = search.toLowerCase();
        return (
          pay.moyen.toLowerCase().includes(q) ||
          pay.folio?.stay?.guest?.nom?.toLowerCase().includes(q) ||
          pay.folio?.stay?.guest?.prenom?.toLowerCase().includes(q) ||
          pay.folio?.stay?.room?.numero?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, search]);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Facturation & Comptes Séjour
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gérez le cycle de vie des folios (ouvert/clôturé), l'émission de
            factures et l'encaissement.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-md border shadow-sm">
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            setStatusFilter("ALL");
          }}
          className="w-full md:w-auto"
        >
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="folios" className="gap-2">
              <Wallet className="size-4" />
              Folios & Comptes
            </TabsTrigger>
            <TabsTrigger value="factures" className="gap-2">
              <FileText className="size-4" />
              Factures émises
            </TabsTrigger>
            <TabsTrigger value="paiements" className="gap-2">
              <CreditCard className="size-4" />
              Historique des paiements
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher (Nom, N°, Chambre)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-background h-9 text-sm"
            />
          </div>
          {activeTab === "folios" && (
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tous les folios</option>
              <option value="OUVERT">Ouverts (Brouillons)</option>
              <option value="CLOTURE">Clôturés (Checkout)</option>
            </select>
          )}
          {activeTab === "factures" && (
            <select
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Tous statuts</option>
              <option value="EMISE">Émise</option>
              <option value="ANNULEE_PAR_AVOIR">Annulée par avoir</option>
            </select>
          )}
        </div>
      </div>

      <div className="mt-2">
        {loading ? (
          <p className="text-muted-foreground text-sm">Chargement...</p>
        ) : error ? (
          <p className="text-destructive text-sm font-medium">{error}</p>
        ) : activeTab === "folios" ? (
          <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-6 gap-4 p-4 border-b font-medium text-muted-foreground text-sm">
                <div className="col-span-1">Folio</div>
                <div className="col-span-1">État Folio</div>
                <div className="col-span-2">Client / Séjour</div>
                <div className="col-span-1 text-right">Solde Dû</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              <div className="divide-y">
                {filteredFolios.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Aucun folio trouvé.
                  </p>
                ) : (
                  filteredFolios.map((fol) => {
                    const solde = Number(fol.soldeDu || 0);
                    return (
                      <div
                        key={fol.id}
                        className="grid grid-cols-6 gap-4 p-4 items-center text-sm"
                      >
                        <div className="col-span-1 font-semibold truncate">
                          {fol.libelle}
                        </div>
                        <div className="col-span-1">
                          <Badge
                            variant={
                              fol.statut === "OUVERT" ? "default" : "secondary"
                            }
                          >
                            {fol.statut === "OUVERT"
                              ? "Ouvert (Brouillon)"
                              : "Clôturé"}
                          </Badge>
                        </div>
                        <div className="col-span-2 flex flex-col">
                          <span className="font-semibold truncate">
                            {fol.stay?.guest?.nom} {fol.stay?.guest?.prenom}
                          </span>
                          <span className="text-xs text-muted-foreground truncate">
                            Chambre {fol.stay?.room?.numero}
                          </span>
                        </div>
                        <div className="col-span-1 text-right font-mono font-medium">
                          <span
                            className={
                              solde > 0
                                ? "text-amber-600 font-bold"
                                : "text-emerald-600"
                            }
                          >
                            {solde.toFixed(2)} MAD
                          </span>
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedFolioStayId(fol.stayId)}
                          >
                            Ouvrir le compte
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : activeTab === "factures" ? (
          <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-6 gap-4 p-4 border-b font-medium text-muted-foreground text-sm">
                <div className="col-span-1">Numéro</div>
                <div className="col-span-1">Statut</div>
                <div className="col-span-2">Client / Séjour</div>
                <div className="col-span-1 text-right">Montant</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>
              <div className="divide-y">
                {filteredInvoices.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Aucune facture trouvée.
                  </p>
                ) : (
                  filteredInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="grid grid-cols-6 gap-4 p-4 items-center text-sm"
                    >
                      <div className="col-span-1 font-mono">{inv.numero}</div>
                      <div className="col-span-1">
                        <Badge
                          variant={
                            inv.statut === "EMISE" ? "default" : "secondary"
                          }
                        >
                          {inv.statut === "EMISE"
                            ? "Émise"
                            : "Annulée par avoir"}
                        </Badge>
                      </div>
                      <div className="col-span-2 flex flex-col">
                        <span className="font-semibold truncate">
                          {inv.folio?.stay?.guest?.nom}{" "}
                          {inv.folio?.stay?.guest?.prenom}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          Chambre {inv.folio?.stay?.room?.numero}
                        </span>
                      </div>
                      <div className="col-span-1 text-right font-mono font-medium">
                        {Number(inv.montantTotal).toFixed(2)} MAD
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPrintingInvoice(inv)}
                          className="gap-2"
                        >
                          <Printer className="size-4" />
                          <span className="hidden sm:inline">Imprimer</span>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-5 gap-4 p-4 border-b font-medium text-muted-foreground text-sm">
                <div className="col-span-1">Date</div>
                <div className="col-span-1">Mode</div>
                <div className="col-span-2">Client / Séjour</div>
                <div className="col-span-1 text-right">Montant</div>
              </div>
              <div className="divide-y">
                {filteredPayments.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Aucun paiement trouvé.
                  </p>
                ) : (
                  filteredPayments.map((pay) => (
                    <div
                      key={pay.id}
                      className="grid grid-cols-5 gap-4 p-4 items-center text-sm"
                    >
                      <div className="col-span-1 text-muted-foreground">
                        {new Date(pay.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="col-span-1">
                        <Badge variant="outline">{pay.moyen}</Badge>
                      </div>
                      <div className="col-span-2 flex flex-col">
                        <span className="font-semibold truncate">
                          {pay.folio?.stay?.guest?.nom}{" "}
                          {pay.folio?.stay?.guest?.prenom}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          Chambre {pay.folio?.stay?.room?.numero}
                        </span>
                      </div>
                      <div className="col-span-1 text-right font-mono font-medium text-green-600">
                        +{Number(pay.montant).toFixed(2)} MAD
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Folio */}
      {selectedFolioStayId !== null && (
        <Dialog open onOpenChange={() => setSelectedFolioStayId(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détail du Compte / Folio Séjour</DialogTitle>
            </DialogHeader>
            <div className="pt-2">
              <BillingTabContent stayId={selectedFolioStayId} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <InvoicePrintModal
        invoice={printingInvoice}
        open={!!printingInvoice}
        onClose={() => setPrintingInvoice(null)}
      />
    </div>
  );
}
