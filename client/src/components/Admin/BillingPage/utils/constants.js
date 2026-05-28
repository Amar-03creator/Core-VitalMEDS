// Demo data & static configuration

export const LINES = [
  { name: 'Cuttack Line',    area: 'Cuttack',     parties: ['Sharma Medical Stores', 'MedCare Stores', 'Ravi Drug House'] },
  { name: 'BBSR Line',       area: 'Bhubaneswar', parties: ['City Pharma'] },
  { name: 'Puri Line',       area: 'Puri',         parties: ['HealthFirst Pharmacy', 'New Life Pharmacy'] },
  { name: 'Berhampur Line',  area: 'Berhampur',   parties: ['Patnaik Medicals'] },
];

export const CLIENT_MASTER = {
  'City Pharma': {
    name: 'City Pharma',
    city: 'Bhubaneswar',
    line: 'BBSR Line',
    gstin: '21AABCS1234A1Z5',
    address: 'Shop No. 12, Market Complex, Buxi Bazar, Bhubaneswar - 751001',
    drugLicense: 'DL-21-4567',
    phone: '9876543210'
  },
  'MedCare Stores': {
    name: 'MedCare Stores',
    city: 'Cuttack',
    line: 'Cuttack Line',
    gstin: '21AABCT5678B2Z6',
    address: 'Choudhury Bazar, Near Big Bazaar, Cuttack - 753002',
    drugLicense: 'DL-21-8912',
    phone: '8765432109'
  },
  'Sharma Medical Stores': {
    name: 'Sharma Medical Stores',
    city: 'Cuttack',
    line: 'Cuttack Line',
    gstin: '21AABCS9012C3Z7',
    address: 'Link Road, Cuttack - 753001',
    drugLicense: 'DL-21-3456',
    phone: '7654321098'
  },
  'HealthFirst Pharmacy': {
    name: 'HealthFirst Pharmacy',
    city: 'Puri',
    line: 'Puri Line',
    gstin: '21AABCH3456D4Z8',
    address: 'Grand Road, Near Jagannath Temple, Puri - 752001',
    drugLicense: 'DL-21-7890',
    phone: '6543210987'
  },
  'Ravi Drug House': {
    name: 'Ravi Drug House',
    city: 'Cuttack',
    line: 'Cuttack Line',
    gstin: '21AABCR7890E5Z9',
    address: 'Mahanadi Vihar, Cuttack - 753003',
    drugLicense: 'DL-21-1234',
    phone: '9876501234'
  },
  'Patnaik Medicals': {
    name: 'Patnaik Medicals',
    city: 'Berhampur',
    line: 'Berhampur Line',
    gstin: '21AABCP2345F6Z0',
    address: 'Gandhi Nagar, Main Road, Berhampur - 760001',
    drugLicense: 'DL-21-5678',
    phone: '8765412345'
  },
  'New Life Pharmacy': {
    name: 'New Life Pharmacy',
    city: 'Puri',
    line: 'Puri Line',
    gstin: '21AABCN6789G7Z1',
    address: 'Sea Beach Road, Puri - 752002',
    drugLicense: 'DL-21-9012',
    phone: '7654321234'
  }
};

export const INVOICES = [
  {
    id: 'MIL-05-2025-042', client: 'City Pharma', area: 'Bhubaneswar', line: 'BBSR Line',
    items: 6, amount: 15200, due: 15200, date: '2025-05-06', dueDate: '2025-05-20',
    status: 'UNPAID', overdueDays: 0, billType: 'Credit', discount: 250,
    products: [
      { name: 'Pantoprazole 40mg', sku: 'PAN-40-TAB', batch: 'PAN-07/26', packing: "10'S Tab", mrp: 48, rate: 34.50, chargeableQty: 120, freeQty: 6, hsn: '300490', gstRate: 12, expiryDate: 'Sep 2026', discountPercent: 0 },
      { name: 'Atorvastatin 10mg', sku: 'ATV-10-STR', batch: 'ATV-F09/26', packing: "10'S Strip", mrp: 55, rate: 42.00, chargeableQty: 80, freeQty: 4, hsn: '300490', gstRate: 12, expiryDate: 'Feb 2027', discountPercent: 0 },
      { name: 'Amlodipine 5mg',    sku: 'AML-5-STR',  batch: 'AML-B12/26', packing: "10'S Strip", mrp: 25, rate: 18.00, chargeableQty: 60, freeQty: 0, hsn: '300490', gstRate: 5,  expiryDate: 'Nov 2026', discountPercent: 0 },
    ],
  },
  {
    id: 'MIL-05-2025-041', client: 'MedCare Stores', area: 'Cuttack', line: 'Cuttack Line',
    items: 4, amount: 22100, due: 0, date: '2025-05-05', dueDate: '2025-05-19',
    status: 'PAID', overdueDays: 0, billType: 'Cash', discount: 0,
    products: [
      { name: 'Paracetamol 500mg', sku: 'PCM-500-STR', batch: 'PCM-A12/26', packing: "10'S Strip", mrp: 18.5, rate: 13.20, chargeableQty: 200, freeQty: 20, hsn: '300490', gstRate: 5, expiryDate: 'Aug 2026', discountPercent: 5 },
      { name: 'Cetirizine 10mg',   sku: 'CTZ-10-STR',   batch: 'CTZ-D04/26', packing: "10'S Strip", mrp: 28, rate: 19.50, chargeableQty: 100, freeQty: 0,  hsn: '300490', gstRate: 5, expiryDate: 'Jun 2026', discountPercent: 0 },
    ],
  },
  {
    id: 'MIL-05-2025-040', client: 'Sharma Medical Stores', area: 'Cuttack', line: 'Cuttack Line',
    items: 9, amount: 45000, due: 20000, date: '2025-05-04', dueDate: '2025-05-18',
    status: 'PARTIALLY_PAID', overdueDays: 0, billType: 'Credit', discount: 500,
    products: [
      { name: 'Metformin 500mg',   sku: 'MET-500-STR', batch: 'MET-E15/25', packing: "10'S Strip", mrp: 32, rate: 24.50, chargeableQty: 200, freeQty: 20, hsn: '300490', gstRate: 5, expiryDate: 'Aug 2025', discountPercent: 10 },
      { name: 'Amoxicillin 250mg', sku: 'AMX-250-CAP', batch: 'AMX-C21/26', packing: '10 Caps',    mrp: 85, rate: 62.00, chargeableQty: 100, freeQty: 10, hsn: '300410', gstRate: 12, expiryDate: 'Mar 2026', discountPercent: 0 },
    ],
  },
  {
    id: 'MIL-05-2025-039', client: 'HealthFirst Pharmacy', area: 'Puri', line: 'Puri Line',
    items: 5, amount: 18200, due: 0, date: '2025-05-04', dueDate: '2025-05-18',
    status: 'PAID', overdueDays: 0, billType: 'Cash', discount: 100,
    products: [
      { name: 'Omeprazole 20mg', sku: 'OME-20-CAP', batch: 'OMZ-X03/26', packing: "10'S Cap", mrp: 38, rate: 28.00, chargeableQty: 150, freeQty: 0, hsn: '300490', gstRate: 12, expiryDate: 'Mar 2026', discountPercent: 0 },
    ],
  },
  {
    id: 'MIL-05-2025-038', client: 'Sharma Medical Stores', area: 'Cuttack', line: 'Cuttack Line',
    items: 7, amount: 34500, due: 34500, date: '2025-05-03', dueDate: '2025-05-17',
    status: 'UNPAID', overdueDays: 0, billType: 'Credit', discount: 0,
    products: [
      { name: 'Atorvastatin 10mg', sku: 'ATV-10-STR', batch: 'ATV-F09/26', packing: "10'S Strip", mrp: 55, rate: 42.00, chargeableQty: 80, freeQty: 8, hsn: '300490', gstRate: 12, expiryDate: 'Feb 2027', discountPercent: 0 },
    ],
  },
  {
    id: 'MIL-04-2025-035', client: 'Ravi Drug House', area: 'Cuttack', line: 'Cuttack Line',
    items: 5, amount: 28000, due: 28000, date: '2025-04-18', dueDate: '2025-05-02',
    status: 'UNPAID', overdueDays: 5, billType: 'Credit', discount: 200,
    products: [
      { name: 'Metformin 500mg', sku: 'MET-500-STR', batch: 'MET-E15/25', packing: "10'S Strip", mrp: 32, rate: 24.50, chargeableQty: 200, freeQty: 0, hsn: '300490', gstRate: 5, expiryDate: 'Aug 2025', discountPercent: 0 },
    ],
  },
  {
    id: 'MIL-04-2025-030', client: 'Ravi Drug House', area: 'Cuttack', line: 'Cuttack Line',
    items: 8, amount: 50000, due: 50000, date: '2025-04-01', dueDate: '2025-04-15',
    status: 'UNPAID', overdueDays: 22, billType: 'Credit', discount: 0,
    products: [],
  },
  {
    id: 'MIL-03-2025-022', client: 'Patnaik Medicals', area: 'Berhampur', line: 'Berhampur Line',
    items: 6, amount: 34500, due: 34500, date: '2025-03-10', dueDate: '2025-03-24',
    status: 'UNPAID', overdueDays: 44, billType: 'Credit', discount: 0,
    products: [],
  },
  {
    id: 'MIL-03-2025-020', client: 'New Life Pharmacy', area: 'Puri', line: 'Puri Line',
    items: 3, amount: 12000, due: 6000, date: '2025-03-05', dueDate: '2025-03-19',
    status: 'PARTIALLY_PAID', overdueDays: 49, billType: 'Credit', discount: 300,
    products: [],
  },
];


export const RECEIPTS = [
  { id: 'REC-25-008', client: 'HealthFirst Pharmacy', area: 'Puri',        line: 'Puri Line',    amount: 18200, date: '2025-05-05', mode: 'UPI',           ref: 'UPI12345678', allocated: [{ id: 'MIL-05-2025-039', amt: 18200 }] },
  { id: 'REC-25-007', client: 'MedCare Stores',       area: 'Cuttack',     line: 'Cuttack Line', amount: 22100, date: '2025-05-06', mode: 'Bank Transfer', ref: 'NEFT0987654', allocated: [{ id: 'MIL-05-2025-041', amt: 22100 }] },
  { id: 'REC-25-006', client: 'Sharma Medical Stores',area: 'Cuttack',     line: 'Cuttack Line', amount: 25000, date: '2025-05-04', mode: 'Cheque',        ref: 'CHQ-445621',  allocated: [{ id: 'MIL-05-2025-040', amt: 25000 }] },
  { id: 'REC-25-005', client: 'City Pharma',          area: 'Bhubaneswar', line: 'BBSR Line',    amount: 12000, date: '2025-05-01', mode: 'Cash',          ref: 'RCPT-0021',   allocated: [] },
];

export const AGING = [
  { client: 'Ravi Drug House',        area: 'Cuttack',     line: 'Cuttack Line',   outstanding: 78000, days: 62, bucket: 'Critical', score: 22 },
  { client: 'Patnaik Medicals',       area: 'Berhampur',   line: 'Berhampur Line', outstanding: 34500, days: 44, bucket: 'Critical', score: 38 },
  { client: 'New Life Pharmacy',      area: 'Puri',        line: 'Puri Line',      outstanding: 18000, days: 49, bucket: 'Critical', score: 31 },
  { client: 'City Pharma',            area: 'Bhubaneswar', line: 'BBSR Line',      outstanding: 15200, days: 18, bucket: 'Warning',  score: 72 },
  { client: 'Sharma Medical Stores',  area: 'Cuttack',     line: 'Cuttack Line',   outstanding: 54500, days: 4,  bucket: 'Current',  score: 88 },
  { client: 'HealthFirst Pharmacy',   area: 'Puri',        line: 'Puri Line',      outstanding: 0,     days: 0,  bucket: 'Current',  score: 95 },
];

export const PURCHASE_BILLS = [
  { id: 'PB-2025-031', supplier: 'Cipla Ltd',      date: '10 Feb', amount: 48500, items: 6, status: 'PAID'          },
  { id: 'PB-2025-030', supplier: 'Mankind Pharma', date: '08 Feb', amount: 22100, items: 3, status: 'PAID'          },
  { id: 'PB-2025-029', supplier: 'Torrent Pharma', date: '01 Feb', amount: 35700, items: 5, status: 'PARTIALLY_PAID'},
  { id: 'PB-2025-027', supplier: 'Sun Pharma',     date: '20 Jan', amount: 19800, items: 2, status: 'UNPAID'        },
];

export const PRODUCT_CATALOG = [
  { id: 'PRD-001', name: 'Paracetamol 500mg', company: 'Cipla', packing: "10'S Strip", hsn: '300490', gstRate: 5, defaultRate: 13.20, batches: [{ no: 'PCM-A12/26', expiry: 'Aug 2026', stock: 900, mrp: 18.5 }] },
  { id: 'PRD-002', name: 'Amoxicillin 250mg', company: 'Sun Pharma', packing: '10 Caps', hsn: '300410', gstRate: 12, defaultRate: 62.00, batches: [{ no: 'AMX-C21/26', expiry: 'Mar 2026', stock: 45, mrp: 85.0 }] },
  { id: 'PRD-003', name: 'Omeprazole 20mg', company: "Dr. Reddy's", packing: "10'S Cap", hsn: '300490', gstRate: 12, defaultRate: 28.00, batches: [{ no: 'OMZ-X03/26', expiry: 'Mar 2026', stock: 0, mrp: 38.0 }] },
  { id: 'PRD-004', name: 'Cetirizine 10mg', company: 'Mankind', packing: "10'S Strip", hsn: '300490', gstRate: 5, defaultRate: 19.50, batches: [{ no: 'CTZ-D04/26', expiry: 'Jun 2026', stock: 890, mrp: 28.0 }] },
  { id: 'PRD-005', name: 'Metformin 500mg', company: 'USV', packing: "10'S Strip", hsn: '300490', gstRate: 5, defaultRate: 24.50, batches: [{ no: 'MET-E15/25', expiry: 'Aug 2025', stock: 234, mrp: 32.0 }] },
  { id: 'PRD-006', name: 'Atorvastatin 10mg', company: 'Torrent', packing: "10'S Strip", hsn: '300490', gstRate: 12, defaultRate: 42.00, batches: [{ no: 'ATV-F09/26', expiry: 'Feb 2027', stock: 560, mrp: 55.0 }] },
  { id: 'PRD-007', name: 'Pantoprazole 40mg', company: 'Alkem', packing: "10'S Tab", hsn: '300490', gstRate: 12, defaultRate: 34.50, batches: [{ no: 'PAN-07/26', expiry: 'Sep 2026', stock: 420, mrp: 48.0 }] },
  { id: 'PRD-008', name: 'Losartan 50mg', company: 'Torrent', packing: "10'S Strip", hsn: '300490', gstRate: 5, defaultRate: 22.00, batches: [{ no: 'LOS-05/26', expiry: 'May 2026', stock: 150, mrp: 35.0 }] },
  { id: 'PRD-009', name: 'Amlodipine 5mg', company: 'Cipla', packing: "10'S Strip", hsn: '300490', gstRate: 5, defaultRate: 18.00, batches: [{ no: 'AML-B12/26', expiry: 'Nov 2026', stock: 300, mrp: 25.0 }] },
  { id: 'PRD-010', name: 'Diclofenac 50mg', company: 'Mankind', packing: "10'S Tab", hsn: '300490', gstRate: 12, defaultRate: 15.00, batches: [{ no: 'DIC-07/26', expiry: 'Jul 2026', stock: 500, mrp: 22.0 }] },
  { id: 'PRD-011', name: 'Cefixime 200mg', company: 'Sun Pharma', packing: '10 Caps', hsn: '300410', gstRate: 12, defaultRate: 85.00, batches: [{ no: 'CFX-09/26', expiry: 'Sep 2026', stock: 80, mrp: 120.0 }] },
  { id: 'PRD-012', name: 'Azithromycin 500mg', company: 'Cipla', packing: '3 Tab', hsn: '300410', gstRate: 12, defaultRate: 45.00, batches: [{ no: 'AZI-11/26', expiry: 'Nov 2026', stock: 200, mrp: 65.0 }] },
  { id: 'PRD-013', name: 'Doxycycline 100mg', company: 'USV', packing: "10'S Cap", hsn: '300410', gstRate: 12, defaultRate: 32.00, batches: [{ no: 'DOX-02/27', expiry: 'Feb 2027', stock: 400, mrp: 50.0 }] },
  { id: 'PRD-014', name: 'Clopidogrel 75mg', company: 'Torrent', packing: "10'S Strip", hsn: '300490', gstRate: 5, defaultRate: 28.00, batches: [{ no: 'CLO-04/27', expiry: 'Apr 2027', stock: 350, mrp: 40.0 }] },
  { id: 'PRD-015', name: 'Montelukast 10mg', company: "Dr. Reddy's", packing: "10'S Tab", hsn: '300490', gstRate: 12, defaultRate: 38.00, batches: [{ no: 'MON-01/27', expiry: 'Jan 2027', stock: 220, mrp: 55.0 }] },
  { id: 'PRD-016', name: 'Levocetirizine 5mg', company: 'Mankind', packing: "10'S Strip", hsn: '300490', gstRate: 5, defaultRate: 24.00, batches: [{ no: 'LEV-03/27', expiry: 'Mar 2027', stock: 780, mrp: 35.0 }] },
  { id: 'PRD-017', name: 'Telmisartan 40mg', company: 'Cipla', packing: "10'S Strip", hsn: '300490', gstRate: 5, defaultRate: 26.00, batches: [{ no: 'TEL-06/27', expiry: 'Jun 2027', stock: 490, mrp: 38.0 }] },
  { id: 'PRD-018', name: 'Gabapentin 300mg', company: 'Sun Pharma', packing: "10'S Cap", hsn: '300490', gstRate: 12, defaultRate: 55.00, batches: [{ no: 'GAB-07/27', expiry: 'Jul 2027', stock: 130, mrp: 80.0 }] },
  { id: 'PRD-019', name: 'Tramadol 50mg', company: 'USV', packing: "10'S Cap", hsn: '300490', gstRate: 12, defaultRate: 22.00, batches: [{ no: 'TRA-09/27', expiry: 'Sep 2027', stock: 270, mrp: 32.0 }] },
  { id: 'PRD-020', name: 'Glimepiride 1mg', company: 'Torrent', packing: "10'S Strip", hsn: '300490', gstRate: 5, defaultRate: 12.00, batches: [{ no: 'GLI-10/27', expiry: 'Oct 2027', stock: 620, mrp: 18.0 }] },
  { id: 'PRD-021', name: 'Piracetam 800mg', company: 'Cipla', packing: "10'S Tab", hsn: '300490', gstRate: 12, defaultRate: 48.00, batches: [{ no: 'PIR-12/27', expiry: 'Dec 2027', stock: 300, mrp: 70.0 }] },
  { id: 'PRD-022', name: 'Moxifloxacin 400mg', company: 'Mankind', packing: '5 Tab', hsn: '300410', gstRate: 12, defaultRate: 72.00, batches: [{ no: 'MOX-02/28', expiry: 'Feb 2028', stock: 180, mrp: 105.0 }] },
  { id: 'PRD-023', name: 'Fluconazole 150mg', company: "Dr. Reddy's", packing: '1 Cap', hsn: '300490', gstRate: 12, defaultRate: 35.00, batches: [{ no: 'FLU-04/28', expiry: 'Apr 2028', stock: 540, mrp: 52.0 }] },
  { id: 'PRD-024', name: 'Pregabalin 75mg', company: 'Torrent', packing: "10'S Cap", hsn: '300490', gstRate: 12, defaultRate: 65.00, batches: [{ no: 'PRE-05/28', expiry: 'May 2028', stock: 210, mrp: 95.0 }] },
  { id: 'PRD-025', name: 'Vitamin D3 60K', company: 'USV', packing: '4 Cap', hsn: '300450', gstRate: 12, defaultRate: 85.00, batches: [{ no: 'VIT-06/28', expiry: 'Jun 2028', stock: 380, mrp: 125.0 }] },
];

export const ALL_CLIENTS = Object.keys(CLIENT_MASTER);
export const ALL_LINES = [...new Set(INVOICES.map(i => i.line))];
export const MODE_EMOJI = { Cash: '💵', UPI: '📱', Cheque: '🏦', 'Bank Transfer': '🔁' };
export const STATUS_CFG = {
  UNPAID:         { pill: 'bg-red-100 text-red-700', label: 'Unpaid', dot: 'bg-red-500' },
  PARTIALLY_PAID: { pill: 'bg-amber-100 text-amber-700', label: 'Partial', dot: 'bg-amber-500' },
  PAID:           { pill: 'bg-emerald-100 text-emerald-700', label: 'Paid', dot: 'bg-emerald-500' },
};
export const BUCKET_CFG = {
  Current:  { pill: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  Warning:  { pill: 'bg-amber-100 text-amber-700',     bar: 'bg-amber-400'   },
  Critical: { pill: 'bg-red-100 text-red-700',         bar: 'bg-red-500'     },
};

export const CLIENTS_BY_LINE = LINES.reduce((acc, line) => {
  line.parties.forEach(p => { acc[p] = line.name; });
  return acc;
}, {});