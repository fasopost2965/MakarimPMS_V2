import { useEffect, useState, useCallback } from "react";
import { CreditCard, FileText } from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvoicePrintModal } from "../components/InvoicePrintModal";

export function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("factures");
  const [printingInvoice, setPrintingInvoice] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "factures") {
        const inv = await apiRequest<any[]>("/invoices");
        setInvoices(inv);
      } else {
        const pay = await apiRequest<any[]>("/payments");
        setPayments(pay);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturation & Caisses</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gérez l'émission de factures, l'historique des paiements et imprimez les PDF au format A4.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-fit">
          <TabsTrigger value="factures" className="gap-2">
            <FileText className="size-4" />
            Factures émises
          </TabsTrigger>
          <TabsTrigger value="paiements" className="gap-2">
            <CreditCard className="size-4" />
            Historique des paiements
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {loading ? (
            <p className="text-muted-foreground text-sm">Chargement...</p>
          ) : error ? (
            <p className="text-destructive text-sm font-medium">{error}</p>
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
                  {invoices.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">Aucune facture émise</p>
                  ) : (
                    invoices.map((inv) => (
                      <div key={inv.id} className="grid grid-cols-6 gap-4 p-4 items-center text-sm">
                        <div className="col-span-1 font-mono">{inv.numero}</div>
                        <div className="col-span-1">
                          <Badge variant={inv.statut === "EMISE" ? "default" : "secondary"}>
                            {inv.statut === "EMISE" ? "Émise" : "Annulée"}
                          </Badge>
                        </div>
                        <div className="col-span-2 flex flex-col">
                          <span className="font-semibold truncate">{inv.folio?.stay?.guest?.nom} {inv.folio?.stay?.guest?.prenom}</span>
                          <span className="text-xs text-muted-foreground truncate">Chambre {inv.folio?.stay?.room?.numero}</span>
                        </div>
                        <div className="col-span-1 text-right font-mono font-medium">
                          {Number(inv.montantTotal).toFixed(2)} MAD
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button size="sm" variant="outline" onClick={() => setPrintingInvoice(inv)}>
                            Imprimer PDF
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
                  {payments.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">Aucun paiement enregistré</p>
                  ) : (
                    payments.map((pay) => (
                      <div key={pay.id} className="grid grid-cols-5 gap-4 p-4 items-center text-sm">
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
                          <span className="font-semibold truncate">{pay.folio?.stay?.guest?.nom} {pay.folio?.stay?.guest?.prenom}</span>
                          <span className="text-xs text-muted-foreground truncate">Chambre {pay.folio?.stay?.room?.numero}</span>
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
      </Tabs>
      
      <InvoicePrintModal 
        invoice={printingInvoice}
        open={!!printingInvoice}
        onClose={() => setPrintingInvoice(null)}
      />
    </div>
  );
}
