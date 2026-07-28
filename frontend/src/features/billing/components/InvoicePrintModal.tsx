import { useEffect, useState } from "react";
import { Download, Hotel, Mail, MapPin, Phone, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getHotelConfig } from "@/features/parameters/api";
import type { HotelConfig } from "@/features/parameters/types";
import type { InvoiceDetail, FolioLine } from "../types";

export function InvoicePrintModal({
  invoice,
  open,
  onClose,
}: {
  invoice: InvoiceDetail | null;
  open: boolean;
  onClose: () => void;
}) {
  const [hotelConfig, setHotelConfig] = useState<HotelConfig | null>(null);

  useEffect(() => {
    if (open) {
      getHotelConfig()
        .then(setHotelConfig)
        .catch(() => {});
    }
  }, [open]);

  if (!invoice) return null;

  const handlePrint = () => {
    const printContent = document.getElementById("printable-invoice");
    if (!printContent) return;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.write("<html><head><title>Facture_" + invoice.numero + "</title>");

      // Copier tous les styles pour garder le design Tailwind
      const headElements = document.head.querySelectorAll(
        'style, link[rel="stylesheet"]',
      );
      headElements.forEach((el) => {
        doc.write(el.outerHTML);
      });

      doc.write(
        "<style>@page { size: A4; margin: 10mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; margin: 0; }</style>",
      );
      doc.write('</head><body class="bg-white">');
      doc.write(printContent.outerHTML);
      doc.write("</body></html>");
      doc.close();

      iframe.contentWindow?.focus();
      // Un peu de délai pour laisser les polices et styles se charger
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 100);
      }, 800);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-100 p-0 border-none shadow-2xl">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 border-b flex items-center justify-between shadow-sm">
          <DialogTitle className="text-lg font-medium text-slate-800">
            Aperçu de la Facture
          </DialogTitle>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2 shadow-sm" size="sm">
              <Download className="size-4" />
              Télécharger PDF / Imprimer
            </Button>
          </div>
        </div>

        <div className="p-8">
          {/* Conteneur de la facture A4 */}
          <div
            id="printable-invoice"
            className="bg-white text-slate-900 w-full max-w-[210mm] min-h-[297mm] mx-auto shadow-sm ring-1 ring-slate-200 p-12 flex flex-col"
            style={{ boxSizing: "border-box" }}
          >
            {/* En-tête : Logo et Titre */}
            <div className="flex justify-between items-start mb-12">
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-slate-900 text-white p-3 rounded-lg shadow-sm flex items-center justify-center">
                    <Hotel className="size-8" />
                  </div>
                  <div>
                    <h2 className="font-bold text-2xl uppercase tracking-widest text-slate-900 leading-none">
                      {hotelConfig?.raisonSociale || "Makarim"}
                    </h2>
                    <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] mt-1 font-semibold">
                      Hôtel {hotelConfig?.categorieEtoiles ? `& Spa ${hotelConfig.categorieEtoiles}★` : "& Spa"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-slate-400" />
                    <span>{hotelConfig?.adresse || "123 Avenue Principale, 10000 Rabat, Maroc"}</span>
                  </div>
                  {hotelConfig?.ice && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Building2 className="size-3.5 text-slate-400" />
                      <span>ICE: {hotelConfig.ice} {hotelConfig.rc ? `| RC: ${hotelConfig.rc}` : ""} {hotelConfig.identifiantFiscal ? `| IF: ${hotelConfig.identifiantFiscal}` : ""}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-slate-400" />
                    <span>+212 5 37 00 00 00</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-slate-400" />
                    <span>contact@hotelmakarim.ma</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end">
                <h1 className="text-5xl font-light tracking-wider text-slate-900 mb-6 uppercase">
                  Facture
                </h1>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 min-w-[200px]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                      N° Facture
                    </span>
                    <span className="font-bold text-slate-900">
                      {invoice.numero}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
                      Date
                    </span>
                    <span className="font-semibold text-slate-900">
                      {new Date(invoice.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informations Client */}
            <div className="mb-12 flex gap-8">
              <div className="flex-1 bg-slate-50 p-5 rounded-xl border border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Facturé à
                </h3>
                <p className="text-xl font-bold text-slate-900 mb-1">
                  {invoice.folio?.stay?.guest?.nom}{" "}
                  {invoice.folio?.stay?.guest?.prenom}
                </p>
                {invoice.folio?.stay?.guest?.email && (
                  <p className="text-sm text-slate-600 flex items-center gap-2">
                    <Mail className="size-3 text-slate-400" />
                    {invoice.folio.stay.guest.email}
                  </p>
                )}
              </div>
              <div className="flex-1 bg-slate-50 p-5 rounded-xl border border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Détails du séjour
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="text-slate-500">Chambre</div>
                  <div className="font-medium text-slate-900 text-right">
                    {invoice.folio?.stay?.room?.numero}
                  </div>
                  <div className="text-slate-500">Folio</div>
                  <div
                    className="font-medium text-slate-900 text-right truncate pl-2"
                    title={invoice.folio?.libelle}
                  >
                    {invoice.folio?.libelle}
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des lignes */}
            <div className="flex-grow">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900">
                    <th className="py-3 px-4 text-xs font-bold text-slate-900 uppercase tracking-wider w-[50%]">
                      Description
                    </th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-900 uppercase tracking-wider text-center w-[25%]">
                      Type
                    </th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-900 uppercase tracking-wider text-right w-[25%]">
                      Montant (MAD)
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {invoice.folio?.lignes
                    ?.filter((l: FolioLine) => l.type !== "PAIEMENT")
                    .map((ligne: FolioLine, index: number) => (
                      <tr
                        key={ligne.id}
                        className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                      >
                        <td className="py-4 px-4 text-slate-800 font-medium">
                          {ligne.libelle || ligne.type}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500 text-center uppercase tracking-wider">
                          <span className="bg-slate-100 px-2 py-1 rounded-md">
                            {ligne.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right font-mono text-slate-900 font-medium">
                          {Number(ligne.montant).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div className="flex justify-end mt-8 mb-16">
              <div className="w-80 bg-slate-900 text-white p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-3 text-sm text-slate-300">
                  <span>Sous-total</span>
                  <span className="font-mono">
                    {Number(invoice.montantTotal).toFixed(2)} MAD
                  </span>
                </div>
                <div className="flex justify-between items-center mb-4 text-sm text-slate-300">
                  <span>TVA (10% & 20%)</span>
                  <span className="text-xs italic bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                    Inclus
                  </span>
                </div>
                <div className="border-t border-slate-700 pt-4 flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                      Total TTC
                    </span>
                    <span className="font-bold text-xl leading-none">
                      Net à payer
                    </span>
                  </div>
                  <span className="font-mono font-bold text-2xl text-white leading-none">
                    {Number(invoice.montantTotal).toFixed(2)}{" "}
                    <span className="text-lg text-slate-400">MAD</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Pied de page - Informations légales */}
            <div className="mt-auto border-t border-slate-200 pt-6 text-center">
              <p className="font-medium text-slate-800 text-sm mb-2">
                Merci d'avoir choisi l'Hôtel Makarim pour votre séjour.
              </p>
              <div className="flex justify-center gap-4 text-[10px] text-slate-500">
                <span className="flex gap-1">
                  <strong className="text-slate-700">ICE:</strong>{" "}
                  123456789012345
                </span>
                <span className="flex gap-1">
                  <strong className="text-slate-700">RC:</strong> 12345
                </span>
                <span className="flex gap-1">
                  <strong className="text-slate-700">Patente:</strong> 12345678
                </span>
                <span className="flex gap-1">
                  <strong className="text-slate-700">IF:</strong> 1234567
                </span>
                <span className="flex gap-1">
                  <strong className="text-slate-700">CNSS:</strong> 1234567
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
