import { Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function InvoicePrintModal({ invoice, open, onClose }: { invoice: any, open: boolean, onClose: () => void }) {
  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="print:hidden flex flex-row items-center justify-between">
          <DialogTitle>Aperçu Facture {invoice.numero}</DialogTitle>
          <Button onClick={() => window.print()} className="gap-2 shrink-0">
            <Printer className="size-4" />
            Imprimer
          </Button>
        </DialogHeader>
        
        {/* Contenu imprimable */}
        <div className="p-8 bg-white text-black min-h-[800px] border mt-4 print:border-none print:m-0 print:p-0">
          <div className="flex justify-between items-start mb-12 border-b pb-8">
            <div>
              <h1 className="text-3xl font-bold">FACTURE</h1>
              <p className="text-sm text-gray-500 mt-1">N° {invoice.numero}</p>
              <p className="text-sm text-gray-500">
                Date: {new Date(invoice.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="text-right">
              <h2 className="font-semibold text-lg">Hôtel Makarim</h2>
              <p className="text-sm text-gray-500">123 Avenue Principale</p>
              <p className="text-sm text-gray-500">10000 Rabat, Maroc</p>
              <p className="text-sm text-gray-500 mt-2">ICE: 123456789012345</p>
            </div>
          </div>

          <div className="mb-12">
            <h3 className="font-semibold mb-2">Facturé à :</h3>
            <p className="text-lg">{invoice.folio?.stay?.guest?.nom} {invoice.folio?.stay?.guest?.prenom}</p>
            {invoice.folio?.stay?.guest?.email && <p className="text-sm text-gray-500">{invoice.folio.stay.guest.email}</p>}
            <p className="text-sm text-gray-500 mt-2">
              Séjour : Chambre {invoice.folio?.stay?.room?.numero}
            </p>
          </div>

          <table className="w-full text-left mb-12">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Montant (MAD)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.folio?.lignes?.filter((l: any) => l.type !== "PAIEMENT").map((ligne: any) => (
                <tr key={ligne.id} className="border-b">
                  <td className="py-3">{ligne.libelle || ligne.type}</td>
                  <td className="py-3 text-right font-mono">{Number(ligne.montant).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end mb-8">
            <div className="w-64 border-t-2 border-black pt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL TTC</span>
                <span className="font-mono">{Number(invoice.montantTotal).toFixed(2)} MAD</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-center text-gray-500 mt-24">
            <p>Merci pour votre séjour à l'Hôtel Makarim.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
