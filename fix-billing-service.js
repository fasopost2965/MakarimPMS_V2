const fs = require('fs');
const file = 'backend/src/modules/billing/billing.service.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/        stay: true,\n        lignes: true,\n        payments: true,\n        stay: { include: { guest: true, room: true } },\n        invoices: {\n          include: {\n            creditNotes: true,\n            payments: true,\n        stay: { include: { guest: true, room: true } },\n          },\n        },\n/g, 
\`        lignes: true,
        payments: true,
        stay: { include: { guest: true, room: true } },
        invoices: {
          include: {
            creditNotes: true,
            payments: true,
          },
        },\n\`);
code = code.replace(/        payments: true,\n        stay: { include: { guest: true, room: true } },\n        invoices: {\n          include: {\n            creditNotes: true,\n            payments: true,\n        stay: { include: { guest: true, room: true } },\n          },\n        },\n/g,
\`        payments: true,
        stay: { include: { guest: true, room: true } },
        invoices: {
          include: {
            creditNotes: true,
            payments: true,
          },
        },\n\`);
code = code.replace(/        creditNotes: true,\n        payments: true,\n        stay: { include: { guest: true, room: true } },\n/g, 
\`        creditNotes: true,
        payments: true,\n\`);
fs.writeFileSync(file, code);
