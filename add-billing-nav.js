const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/layout/nav-items.ts', 'utf8');

const billingItem = `
  {
    tab: "billing",
    label: "Facturation & Caisses",
    icon: Receipt,
    category: "exploitation",
    permission: "billing:read",
  },`;

code = code.replace(/export const NAV_ITEMS: NavItem\[\] = \[/, 'import { Receipt } from "lucide-react";\n\nexport const NAV_ITEMS: NavItem[] = [' + billingItem);

fs.writeFileSync('frontend/src/components/layout/nav-items.ts', code);
