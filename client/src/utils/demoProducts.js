// src/utils/demoProducts.js

/**
 * Single shared product catalog for demo/offline use.
 *
 * Before this, ClientProductsPage.jsx and ClientInquiryPage.jsx each had
 * their OWN hardcoded product array, with different shapes (`totalStock`
 * vs `stock`, `inStock` boolean vs derived) and different items. That's
 * exactly the kind of drift that causes "works on the Products page,
 * broken on the Cart page" bugs. One source now.
 *
 * Field names deliberately mirror the real Product schema
 * (totalStock, lowStockThreshold, criticalStockThresholdPercent) so the
 * local stock-tier fallback in useStockAvailability.js computes the same
 * way the backend's stockTier.js helper does — swap this module for a
 * real GET /api/products call later and nothing downstream needs to change.
 */
export const demoProducts = [
  {
    productId: 'PRD-001', name: 'Paracetamol 500mg', company: 'Cipla',
    composition: 'Paracetamol 500mg', category: 'Analgesic', type: 'Tablet',
    packing: "10'S Strip", mrp: 18.50, price: 13.20, gstRate: 5,
    totalStock: 1240, lowStockThreshold: 200, criticalStockThresholdPercent: 50,
    isNew: false, nearExpiry: false,
    description: 'For relief of mild to moderate pain and fever.',
    storage: 'Store below 25°C, away from direct sunlight.',
    deliveryTime: '12–24 hours', closestExpiry: '2026-08',
  },
  {
    productId: 'PRD-002', name: 'Amoxicillin 250mg', company: 'Sun Pharma',
    composition: 'Amoxicillin Trihydrate 250mg', category: 'Antibiotic', type: 'Capsule',
    packing: '10 Capsules', mrp: 85.00, price: 62.00, gstRate: 12,
    totalStock: 45, lowStockThreshold: 100, criticalStockThresholdPercent: 50,
    isNew: false, nearExpiry: false,
    description: 'Broad-spectrum antibiotic for bacterial infections.',
    storage: 'Store in a cool, dry place below 25°C.',
    deliveryTime: '12–24 hours', closestExpiry: '2026-03',
  },
  {
    productId: 'PRD-003', name: "Omeprazole 20mg", company: "Dr. Reddy's",
    composition: 'Omeprazole 20mg', category: 'GI', type: 'Capsule',
    packing: "10'S Capsule", mrp: 38.00, price: 28.00, gstRate: 12,
    totalStock: 0, lowStockThreshold: 100, criticalStockThresholdPercent: 50,
    isNew: false, nearExpiry: false,
    description: 'Proton pump inhibitor for acid reflux and ulcers.',
    storage: 'Protect from moisture. Store at room temperature.',
    deliveryTime: 'Currently out of stock', closestExpiry: '—',
  },
  {
    productId: 'PRD-004', name: 'Cetirizine 10mg', company: 'Mankind',
    composition: 'Cetirizine HCl 10mg', category: 'Antihistamine', type: 'Tablet',
    packing: "10'S Strip", mrp: 28.00, price: 19.50, gstRate: 5,
    totalStock: 890, lowStockThreshold: 150, criticalStockThresholdPercent: 50,
    isNew: true, nearExpiry: false,
    description: 'For allergy, urticaria and hay fever.',
    storage: 'Store below 30°C in a dry place.',
    deliveryTime: '12–24 hours', closestExpiry: '2026-06',
  },
  {
    productId: 'PRD-005', name: 'Metformin 500mg', company: 'USV',
    composition: 'Metformin HCl 500mg', category: 'Antidiabetic', type: 'Tablet',
    packing: "10'S Strip", mrp: 32.00, price: 18.00, gstRate: 5,
    totalStock: 234, lowStockThreshold: 150, criticalStockThresholdPercent: 50,
    isNew: false, nearExpiry: true,
    offer: { batchId: 'BATCH-005-A', availableQty: 15, expiryDate: '2025-08-31', price: 14.00, extraOffText: '12% extra off' },
    description: 'First-line treatment for type 2 diabetes.',
    storage: 'Store below 25°C away from moisture.',
    deliveryTime: '12–24 hours', closestExpiry: '2025-08',
  },
  {
    productId: 'PRD-006', name: 'Atorvastatin 10mg', company: 'Torrent',
    composition: 'Atorvastatin Calcium 10mg', category: 'Lipid-lowering', type: 'Tablet',
    packing: "10'S Strip", mrp: 55.00, price: 42.00, gstRate: 12,
    totalStock: 560, lowStockThreshold: 150, criticalStockThresholdPercent: 50,
    isNew: false, nearExpiry: false,
    description: 'For lowering LDL cholesterol and reducing cardiovascular risk.',
    storage: 'Store at room temperature, away from heat and moisture.',
    deliveryTime: '12–24 hours', closestExpiry: '2027-02',
  },
  {
    productId: 'PRD-007', name: 'Pantoprazole 40mg', company: 'Alkem',
    composition: 'Pantoprazole Sodium 40mg', category: 'GI', type: 'Tablet',
    packing: "10'S Tablet", mrp: 48.00, price: 34.50, gstRate: 12,
    totalStock: 22, lowStockThreshold: 100, criticalStockThresholdPercent: 50,
    isNew: false, nearExpiry: true,
    offer: { batchId: 'BATCH-007-A', availableQty: 40, expiryDate: '2025-09-30', price: 27.50, extraOffText: '15% extra off' },
    description: 'Proton pump inhibitor for gastroesophageal reflux.',
    storage: 'Do not crush. Store below 30°C.',
    deliveryTime: '12–24 hours', closestExpiry: '2025-09',
  },
  {
    productId: 'PRD-008', name: 'Glimepiride 2mg', company: 'Sanofi',
    composition: 'Glimepiride 2mg', category: 'Antidiabetic', type: 'Tablet',
    packing: "10'S Tablet", mrp: 42.00, price: 30.00, gstRate: 5,
    totalStock: 180, lowStockThreshold: 150, criticalStockThresholdPercent: 50,
    isNew: true, nearExpiry: false,
    description: 'Sulfonylurea for type 2 diabetes management.',
    storage: 'Store in a cool dry place.',
    deliveryTime: '12–24 hours', closestExpiry: '2026-11',
  },
  {
    productId: 'PRD-009', name: 'Amlodipine 5mg', company: 'Cipla',
    composition: 'Amlodipine Besylate 5mg', category: 'Cardiac', type: 'Tablet',
    packing: "10'S Strip", mrp: 25.00, price: 18.00, gstRate: 5,
    totalStock: 780, lowStockThreshold: 150, criticalStockThresholdPercent: 50,
    isNew: false, nearExpiry: false,
    description: 'Calcium channel blocker for hypertension.',
    storage: 'Store below 30°C.',
    deliveryTime: '12–24 hours', closestExpiry: '2026-12',
  },
  {
    productId: 'PRD-010', name: 'Losartan 50mg', company: 'Sun Pharma',
    composition: 'Losartan Potassium 50mg', category: 'Cardiac', type: 'Tablet',
    packing: "10'S Strip", mrp: 32.00, price: 22.00, gstRate: 5,
    totalStock: 340, lowStockThreshold: 150, criticalStockThresholdPercent: 50,
    isNew: false, nearExpiry: false,
    description: 'Angiotensin receptor blocker for hypertension.',
    storage: 'Store below 30°C.',
    deliveryTime: '12–24 hours', closestExpiry: '2026-10',
  },
];

export const categories = ['All', 'Analgesic', 'Antibiotic', 'GI', 'Antihistamine', 'Antidiabetic', 'Lipid-lowering', 'Cardiac'];
export const sortOptions = ['Top Selling', 'Price: Low to High', 'Price: High to Low', 'Alphabetical'];

export const findDemoProduct = (productId) => demoProducts.find((p) => p.productId === productId);