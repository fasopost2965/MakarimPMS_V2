import * as fs from 'fs';

const billingService = fs.readFileSync('backend/src/modules/billing/billing.service.ts', 'utf8');
const invoicesFindAll = `
  async findAllInvoices() {
    return this.prisma.invoice.findMany({
      include: { folio: { include: { stay: { include: { guest: true, room: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }
`;
fs.writeFileSync('backend/src/modules/billing/billing.service.ts', billingService.replace('async findInvoiceById', invoicesFindAll + '\n  async findInvoiceById'));

const billingCtrl = fs.readFileSync('backend/src/modules/billing/billing.controller.ts', 'utf8');
const invoicesFindAllCtrl = `
  @RequirePermission('billing', 'read')
  @ApiOperation({ summary: "Liste toutes les factures" })
  @Get('invoices')
  findAllInvoices() {
    return this.billingService.findAllInvoices();
  }
`;
fs.writeFileSync('backend/src/modules/billing/billing.controller.ts', billingCtrl.replace('findInvoiceById(@Param', invoicesFindAllCtrl + '\n  findInvoiceById(@Param'));

const paymentsService = fs.readFileSync('backend/src/modules/payments/payments.service.ts', 'utf8');
const paymentsFindAll = `
  async findAll() {
    return this.prisma.payment.findMany({
      include: { folio: { include: { stay: { include: { guest: true, room: true } } } }, invoice: true },
      orderBy: { datePaiement: 'desc' },
    });
  }
`;
fs.writeFileSync('backend/src/modules/payments/payments.service.ts', paymentsService.replace('async findById', paymentsFindAll + '\n  async findById'));

const paymentsCtrl = fs.readFileSync('backend/src/modules/payments/payments.controller.ts', 'utf8');
const paymentsFindAllCtrl = `
  @RequirePermission('payments', 'read')
  @ApiOperation({ summary: "Liste tous les paiements" })
  @Get('payments')
  findAll() {
    return this.paymentsService.findAll();
  }
`;
fs.writeFileSync('backend/src/modules/payments/payments.controller.ts', paymentsCtrl.replace('findOne(@Param', paymentsFindAllCtrl + '\n  findOne(@Param'));

console.log("Done");
