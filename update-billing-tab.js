const fs = require('fs');
let code = fs.readFileSync('frontend/src/features/billing/components/BillingTabContent.tsx', 'utf8');

// Add imports
code = code.replace(/import type { Folio } from "\.\.\/types";/, 'import type { Folio, InvoiceDetail } from "../types";\nimport { Printer } from "lucide-react";\nimport { InvoicePrintModal } from "./InvoicePrintModal";');

// Add state
code = code.replace(/const \[payingFolioId, setPayingFolioId\] = useState<number \| null>\(null\);/, 'const [payingFolioId, setPayingFolioId] = useState<number | null>(null);\n  const [printingInvoice, setPrintingInvoice] = useState<InvoiceDetail | null>(null);');

// Add button
code = code.replace(/<span className="font-mono text-sm font-semibold">\s*\{Number\(invoice\.montantTotal\)\.toFixed\(2\)\} MAD\s*<\/span>/, `<div className="flex items-center gap-4">
                      <span className="font-mono text-sm font-semibold">
                        {Number(invoice.montantTotal).toFixed(2)} MAD
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setPrintingInvoice({...invoice, folio})}
                        className="h-8 w-8"
                        title="Imprimer"
                      >
                        <Printer className="size-4" />
                      </Button>
                    </div>`);

// Add modal
code = code.replace(/<\/div>\s*\);\s*\}\s*$/, `      <InvoicePrintModal
        open={!!printingInvoice}
        onClose={() => setPrintingInvoice(null)}
        invoice={printingInvoice}
      />
    </div>
  );
}
`);

fs.writeFileSync('frontend/src/features/billing/components/BillingTabContent.tsx', code);
