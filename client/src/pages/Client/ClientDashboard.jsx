import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Import all extracted components
import PromoGrid from '../../features/Client/Dashboard/PromoGrid';
import MonthlySummary from '../../features/Client/Dashboard/MonthlySummary';
import CreditLimitUsage from '../../features/Client/Dashboard/CreditLimitUsage';
import Greeting from '../../features/Client/Dashboard/Greeting';
import PendingApprovalAlert from '../../features/Client/Dashboard/PendingApprovalAlert';      // fixed name
import TopProducts from '../../features/Client/Dashboard/TopProducts';
import RecentOrders from '../../features/Client/Dashboard/RecentOrders';

/* ── DEMO DATA ── */
const CLIENT = {
    name: 'Sharma Medical Stores',
    owner: 'Rajesh Sharma',
    tier: 'Diamond',
    status: 'Active',
    creditScore: 88,
    outstanding: 45000,
    creditLimit: 150000,
};

const recentOrders = [
    {
        id: 'ORD-2024-201',
        date: '07 May 2025',
        amount: 12400,
        status: 'Placed',
        products: [
            { name: 'Paracetamol 500mg', quantity: 15 },
            { name: 'Amoxicillin 250mg', quantity: 10 }
        ]
    },
    {
        id: 'ORD-2024-195',
        date: '03 May 2025',
        amount: 34500,
        status: 'Delivered',
        products: [
            { name: 'Metformin 500mg', quantity: 20 },
            { name: 'Cetirizine 10mg', quantity: 6 },
            { name: 'Azithromycin 500mg', quantity: 3 }
        ]
    },
    {
        id: 'ORD-2024-189',
        date: '28 Apr 2025',
        amount: 18200,
        status: 'Delivered',
        products: [
            { name: 'Atorvastatin 10mg', quantity: 8 },
            { name: 'Omeprazole 20mg', quantity: 4 }
        ]
    },
];


// Inside ClientDashboard.jsx, before the return statement
const topProducts = [
    {
        id: 1,
        name: 'Paracetamol 500mg Tablets',
        company: 'Cipla',
        category: 'Analgesic',
        packSize: 'Strip of 10 tablets',
        price: 18.5,
        mrp: 25,
        sku: 'CIP-PCM-500-10',
        inStock: true,
        isNew: false,
        prescriptionRequired: false,
        thumbnail: 'https://via.placeholder.com/56?text=P',
        composition: 'Paracetamol 500mg',
        usageDosage: 'Adults: 1 tablet after food when needed. Do not exceed the recommended dose.',
        deliveryTime: '2–5 business days',
        gstRate: 12,
        description: 'For relief of mild to moderate pain and fever.',
        storage: 'Store below 25°C, away from direct sunlight.',
        lowStockThreshold: 20,
        batches: [
            { batchNo: 'CIP-2401', expiryDateLabel: 'Dec 2026', expiryDateValue: '2026-12-01', stock: 120, price: 18.5, isShortExpiry: false },
            { batchNo: 'CIP-2402', expiryDateLabel: 'Aug 2027', expiryDateValue: '2027-08-01', stock: 200, price: 19, isShortExpiry: false },
            { batchNo: 'CIP-2403', expiryDateLabel: 'Jan 2027', expiryDateValue: '2027-01-01', stock: 80, price: 18.75, isShortExpiry: false },
        ],
    },
    {
        id: 2,
        name: 'Amoxicillin 250mg Capsules',
        company: 'Mankind Pharma',
        category: 'Antibiotic',
        packSize: 'Strip of 10 capsules',
        price: 45,
        mrp: 85,
        sku: 'MAN-AMX-250-10',
        inStock: true,
        isNew: false,
        prescriptionRequired: true,
        thumbnail: 'https://via.placeholder.com/56?text=A',
        composition: 'Amoxicillin Trihydrate 250mg',
        usageDosage: 'As directed by the physician. Typically 1 capsule 3 times a day after food.',
        deliveryTime: '2–5 business days. Requires prescription.',
        gstRate: 12,
        description: 'Broad-spectrum antibiotic for bacterial infections.',
        storage: 'Store below 25°C. Keep away from moisture.',
        lowStockThreshold: 20,
        batches: [
            { batchNo: 'MAN-2201', expiryDateLabel: 'May 2026', expiryDateValue: '2026-05-01', stock: 6, price: 37, isShortExpiry: true, extraDiscount: '15%' },
            { batchNo: 'MAN-2204', expiryDateLabel: 'Jul 2026', expiryDateValue: '2026-07-01', stock: 4, price: 35, isShortExpiry: true, extraDiscount: '20%' },
            { batchNo: 'MAN-2202', expiryDateLabel: 'Nov 2026', expiryDateValue: '2026-11-01', stock: 8, price: 45, isShortExpiry: false },
            { batchNo: 'MAN-2203', expiryDateLabel: 'Jan 2027', expiryDateValue: '2027-01-01', stock: 11, price: 48.5, isShortExpiry: false },
        ],
    },
    {
        id: 3,
        name: 'Cetirizine 10mg Tablets',
        company: 'Dr. Reddy’s',
        category: 'Antihistamine',
        packSize: 'Strip of 10 tablets',
        price: 28,
        mrp: 38,
        sku: 'DRL-CET-10-10',
        inStock: true,
        isNew: true,
        prescriptionRequired: false,
        thumbnail: 'https://via.placeholder.com/56?text=C',
        composition: 'Cetirizine Dihydrochloride 10mg',
        usageDosage: 'Adults: 1 tablet once daily, usually in the evening.',
        deliveryTime: '1–3 business days',
        gstRate: 12,
        description: 'For allergy, urticaria and hay fever.',
        storage: 'Store below 30°C in a dry place.',
        lowStockThreshold: 20,
        batches: [
            { batchNo: 'DRL-2301', expiryDateLabel: 'Jun 2026', expiryDateValue: '2026-06-01', stock: 90, price: 28, isShortExpiry: false },
            { batchNo: 'DRL-2302', expiryDateLabel: 'Aug 2026', expiryDateValue: '2026-08-01', stock: 110, price: 28, isShortExpiry: false },
        ],
    },
    {
        id: 4,
        name: 'Amlodipine 5mg Tablets',
        company: 'Torrent Pharma',
        category: 'Antihypertensive',
        packSize: 'Strip of 10 tablets',
        price: 22,
        mrp: 35,
        sku: 'TOR-AML-5-10',
        inStock: true,
        isNew: false,
        prescriptionRequired: true,
        thumbnail: 'https://via.placeholder.com/56?text=AM',
        composition: 'Amlodipine Besylate 5mg',
        usageDosage: 'As prescribed by the doctor, usually 1 tablet once daily.',
        deliveryTime: '2–4 business days',
        gstRate: 5,
        description: 'For hypertension and angina.',
        storage: 'Store at room temperature away from light.',
        lowStockThreshold: 20,
        batches: [
            { batchNo: 'TOR-2201', expiryDateLabel: 'May 2027', expiryDateValue: '2027-05-01', stock: 8, price: 22, isShortExpiry: false },
            { batchNo: 'TOR-2202', expiryDateLabel: 'Nov 2026', expiryDateValue: '2026-11-01', stock: 10, price: 22, isShortExpiry: false },
            { batchNo: 'TOR-2203', expiryDateLabel: 'Sep 2026', expiryDateValue: '2026-09-01', stock: 3, price: 18, isShortExpiry: true, extraDiscount: '25%' },
        ],
    },
    {
        id: 5,
        name: 'Azithromycin 500mg Tablet',
        company: 'Sun Pharma',
        category: 'Antibiotic',
        packSize: 'Pack of 3 tablets',
        price: 95,
        mrp: 120,
        sku: 'SUN-AZI-500-3',
        inStock: false,
        isNew: false,
        prescriptionRequired: true,
        thumbnail: 'https://via.placeholder.com/56?text=AZ',
        composition: 'Azithromycin Dihydrate 500mg',
        usageDosage: 'Only on doctor’s advice. Commonly used once daily for a short course.',
        deliveryTime: 'Out of stock',
        gstRate: 12,
        description: 'Broad-spectrum macrolide antibiotic.',
        storage: 'Store below 30°C.',
        lowStockThreshold: 20,
        batches: [
            { batchNo: 'SUN-1901', expiryDateLabel: 'Jan 2026', expiryDateValue: '2026-01-01', stock: 0, price: 95, isShortExpiry: false },
        ],
    },
    {
        id: 6,
        name: 'Glimepiride + Metformin + Pioglitazone Tablet',
        company: 'USV Ltd',
        category: 'Antidiabetic',
        packSize: 'Strip of 10 tablets',
        price: 78.5,
        mrp: 125,
        sku: 'USV-GMP-2-500-15',
        inStock: true,
        isNew: false,
        prescriptionRequired: true,
        thumbnail: 'https://via.placeholder.com/56?text=GMP',
        composition: 'Glimepiride (2mg) + Metformin (500mg) + Pioglitazone (15mg)',
        usageDosage: 'As directed by the physician. Usually taken once daily after food.',
        deliveryTime: '2–5 business days',
        gstRate: 5,
        description: 'Combination therapy for type 2 diabetes mellitus.',
        storage: 'Store at room temperature away from moisture.',
        lowStockThreshold: 20,
        batches: [
            { batchNo: 'USV-2210', expiryDateLabel: 'Nov 2026', expiryDateValue: '2026-11-01', stock: 22, price: 78.5, isShortExpiry: false },
            { batchNo: 'USV-2211', expiryDateLabel: 'Jun 2026', expiryDateValue: '2026-06-01', stock: 5, price: 70, isShortExpiry: true, extraDiscount: '10%' },
            { batchNo: 'USV-2212', expiryDateLabel: 'Mar 2027', expiryDateValue: '2027-03-01', stock: 18, price: 81, isShortExpiry: false },
        ],
    },
    {
        id: 7,
        name: 'Pantoprazole 40mg Tablets',
        company: 'Alkem',
        category: 'Gastrointestinal',
        packSize: 'Strip of 10 tablets',
        price: 42,
        mrp: 60,
        sku: 'ALK-PAN-40-10',
        inStock: true,
        isNew: false,
        prescriptionRequired: false,
        thumbnail: 'https://via.placeholder.com/56?text=PP',
        composition: 'Pantoprazole Sodium Sesquihydrate 40mg',
        usageDosage: 'Usually 1 tablet before breakfast, or as prescribed.',
        deliveryTime: '1–4 business days',
        gstRate: 12,
        description: 'For acidity, reflux and gastric protection.',
        storage: 'Store below 30°C in a dry place.',
        lowStockThreshold: 20,
        batches: [
            { batchNo: 'ALK-3301', expiryDateLabel: 'Sep 2026', expiryDateValue: '2026-09-01', stock: 55, price: 42, isShortExpiry: false },
            { batchNo: 'ALK-3302', expiryDateLabel: 'Feb 2027', expiryDateValue: '2027-02-01', stock: 44, price: 42, isShortExpiry: false },
            { batchNo: 'ALK-3303', expiryDateLabel: 'Dec 2027', expiryDateValue: '2027-12-01', stock: 25, price: 43, isShortExpiry: false },
        ],
    },
    {
        id: 8,
        name: 'Cefixime 200mg Tablets',
        company: 'Macleods',
        category: 'Antibiotic',
        packSize: 'Strip of 10 tablets',
        price: 110,
        mrp: 145,
        sku: 'MAC-CFX-200-10',
        inStock: true,
        isNew: true,
        prescriptionRequired: true,
        thumbnail: 'https://via.placeholder.com/56?text=CF',
        composition: 'Cefixime Trihydrate 200mg',
        usageDosage: 'Usually taken once or twice daily as prescribed.',
        deliveryTime: '2–5 business days',
        gstRate: 12,
        description: 'Used for bacterial infections when prescribed by a doctor.',
        storage: 'Store below 25°C and protect from moisture.',
        lowStockThreshold: 20,
        batches: [
            { batchNo: 'MAC-4401', expiryDateLabel: 'Oct 2026', expiryDateValue: '2026-10-01', stock: 12, price: 110, isShortExpiry: false },
            { batchNo: 'MAC-4402', expiryDateLabel: 'Jan 2027', expiryDateValue: '2027-01-01', stock: 7, price: 112, isShortExpiry: false },
            { batchNo: 'MAC-4403', expiryDateLabel: 'Aug 2026', expiryDateValue: '2026-08-01', stock: 2, price: 85, isShortExpiry: true, extraDiscount: '40%' },
        ],
    },
];

// Party registered in January 2024
const partyStartDate = { year: 2024, month: 0 };

// Generate realistic monthly data from Jan 2024 to May 2026
const generateRealisticSummaryData = () => {
    const data = {};
    const startYear = 2024;
    const startMonth = 0; // Jan
    const endYear = 2026;
    const endMonth = 4; // May (0-indexed)

    let cumulativeOutstanding = 5000;

    for (let year = startYear; year <= endYear; year++) {
        const monthStart = (year === startYear) ? startMonth : 0;
        const monthEnd = (year === endYear) ? endMonth : 11;
        for (let month = monthStart; month <= monthEnd; month++) {
            let orderedBase = 0;
            if (year === 2024) orderedBase = 50000 + Math.random() * 30000;
            else if (year === 2025) orderedBase = 70000 + Math.random() * 40000;
            else orderedBase = 85000 + Math.random() * 30000;

            if (month >= 2 && month <= 4) orderedBase *= 1.2;
            if (month >= 9 && month <= 11) orderedBase *= 1.15;

            const ordered = Math.round(orderedBase / 1000) * 1000;
            const totalDue = ordered + cumulativeOutstanding;
            const paidPercent = 0.75 + Math.random() * 0.2;
            const paid = Math.round(totalDue * paidPercent / 1000) * 1000;
            const outstanding = totalDue - paid;
            const prevDue = cumulativeOutstanding;

            const key = `${year}-${String(month + 1).padStart(2, '0')}`;
            data[key] = { ordered, prevDue, paid, outstanding };
            cumulativeOutstanding = outstanding;
        }
    }
    return data;
};

const summaryData = generateRealisticSummaryData();

const ClientDashboard = () => {
    const isApproved = CLIENT.status === 'Active';

    return (
        <div className="px-4 py-5 space-y-6 max-w-2xl mx-auto">
            {/* Greeting */}
            <Greeting owner={CLIENT.owner} tier={CLIENT.tier} />

            {/* Pending alert */}
            {!isApproved && <PendingAlert />}

            {/* Credit usage */}
            {isApproved && (
                <CreditLimitUsage
                    outstanding={CLIENT.outstanding}
                    creditLimit={CLIENT.creditLimit}
                    creditScore={CLIENT.creditScore}
                />
            )}

            {/* Promo Grid */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-slate-800 font-bold text-xl">Offers & Info</h2>
                    <span className="text-slate-400 text-sm">Tap any tile</span>
                </div>
                <PromoGrid />   {/* ✅ now included */}
            </div>

            {/* Monthly Summary */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-slate-800 font-bold text-xl">Monthly Summary</h2>
                    <Link to="/client-dashboard/billing" className="text-emerald-600 text-md font-semibold flex items-center gap-1">
                        Full Ledger <ArrowRight size={13} />
                    </Link>
                </div>
                <MonthlySummary
                    summaryData={summaryData}
                    startDate={partyStartDate}
                    currentDate={new Date()}
                    onMonthChange={({ year, month }) => console.log(`Selected ${year}-${month + 1}`)}
                />
            </div>

            {/* Top Products */}
            <TopProducts
                products={topProducts}
                isClientApproved={CLIENT.status === 'Active'}
                onAddToCart={(item) => console.log('Add to cart', item)}
                onAddToInquiry={(item) => console.log('Add to inquiry', item)}
            />

            {/* Recent Orders */}
            <RecentOrders orders={recentOrders} />

            <div className="h-2" />
        </div>
    );
};

export default ClientDashboard;