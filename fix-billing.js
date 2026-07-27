const fs = require('fs');
let code = fs.readFileSync('backend/src/modules/billing/billing.controller.ts', 'utf8');

const correctCode = code.replace(
  `  findInvoiceById(@Param('id', ParseIntPipe) id: number) {`,
  `  @RequirePermission('billing', 'read')
  @ApiOperation({ summary: "Détail d'une facture" })
  @Get('invoices/:id')
  findInvoiceById(@Param('id', ParseIntPipe) id: number) {`
);

fs.writeFileSync('backend/src/modules/billing/billing.controller.ts', correctCode);
