const mongoose = require('mongoose');
const Product = require('../models/Product');
const Batch = require('../models/Batch');
const Company = require('../models/Company');
const SalesInvoice = require('../models/SalesInvoice');

const STRATEGY_DAYS = {
    'Last 30 Days Velocity': 30,
    'Last 60 Days Velocity': 60,
    'Last 90 Days Velocity': 90,
};

/* ── generateSuggestions ──────────────────────────────────────
   Doc section 4.3 / Sub-Tab C:
   1. Fetch historical SalesInvoice items for the selected product/period.
   2. Calculate average demand per month (or per multi-year season).
   3. Subtract current physical stock.
   4. Suggest an order quantity per product, grouped by supplier if "All Companies".

   Body params:
   - supplierId: 'all' | ObjectId
   - strategy: one of STRATEGY_DAYS keys, or 'Upcoming Season Average'
   - seasonMonths: [1..12]  (only used for seasonal strategy)
   - stockCoverMonths: Number  (how many months of stock the suggested qty should cover)
*/
exports.generateSuggestions = async (req, res) => {
    try {
        const { supplierId, strategy, seasonMonths, stockCoverMonths } = req.body;
        const coverMonths = parseFloat(stockCoverMonths) || 1;

        const productMatch = {};
        if (supplierId && supplierId !== 'all') {
            productMatch.companyId = new mongoose.Types.ObjectId(supplierId);
        }

        const products = await Product.find(productMatch).lean();
        if (products.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }
        const productIds = products.map(p => p._id);

        let demandByProduct = new Map(); // productId -> { totalQty, periodsCount, perMonth }

        if (strategy === 'Upcoming Season Average') {
            const months = (seasonMonths || []).map(Number);
            if (months.length === 0) {
                return res.status(400).json({ message: 'Select at least one season month for this strategy.' });
            }

            // Look back up to 4 prior years for the same set of months.
            const currentYear = new Date().getFullYear();
            const years = [currentYear - 1, currentYear - 2, currentYear - 3, currentYear - 4];

            const agg = await SalesInvoice.aggregate([
                { $unwind: '$items' },
                { $match: { 'items.productId': { $in: productIds } } },
                {
                    $project: {
                        productId: '$items.productId',
                        qty: { $add: ['$items.chargeableQty', '$items.freeQty'] },
                        month: { $month: '$invoiceDate' },
                        year: { $year: '$invoiceDate' },
                    },
                },
                { $match: { month: { $in: months }, year: { $in: years } } },
                {
                    $group: {
                        _id: { productId: '$productId', year: '$year' },
                        yearlyQty: { $sum: '$qty' },
                    },
                },
                {
                    $group: {
                        _id: '$_id.productId',
                        totalQty: { $sum: '$yearlyQty' },
                        yearsSeen: { $sum: 1 },
                    },
                },
            ]);

            agg.forEach(row => {
                const monthsInSeason = months.length;
                const avgPerSeason = row.totalQty / Math.max(1, row.yearsSeen);
                demandByProduct.set(String(row._id), {
                    totalQty: row.totalQty,
                    perMonth: avgPerSeason / monthsInSeason,
                    basis: `${row.yearsSeen}-yr seasonal avg`,
                });
            });
        } else {
            const days = STRATEGY_DAYS[strategy] || 30;
            const since = new Date();
            since.setDate(since.getDate() - days);

            const agg = await SalesInvoice.aggregate([
                { $match: { invoiceDate: { $gte: since } } },
                { $unwind: '$items' },
                { $match: { 'items.productId': { $in: productIds } } },
                {
                    $group: {
                        _id: '$items.productId',
                        totalQty: { $sum: { $add: ['$items.chargeableQty', '$items.freeQty'] } },
                    },
                },
            ]);

            agg.forEach(row => {
                demandByProduct.set(String(row._id), {
                    totalQty: row.totalQty,
                    perMonth: row.totalQty / (days / 30),
                    basis: `${days}-day velocity`,
                });
            });
        }

        const suggestions = products
            .map(p => {
                const demand = demandByProduct.get(String(p._id));
                if (!demand || demand.perMonth <= 0) return null;

                const projectedDemand = Math.round(demand.perMonth * coverMonths);
                const currentStock = p.totalStock || 0;
                const suggestedQty = Math.max(0, projectedDemand - currentStock);

                if (suggestedQty <= 0) return null;

                let priority = 'Normal';
                if (currentStock === 0) priority = 'Critical';
                else if (currentStock < demand.perMonth * 0.5) priority = 'High';

                return {
                    productId: p._id,
                    productName: p.name,
                    companyId: p.companyId,
                    companyName: p.company,
                    currentStock,
                    avgMonthlyDemand: Math.round(demand.perMonth),
                    projectedDemand,
                    suggestedQty,
                    finalQty: suggestedQty,
                    priority,
                    basis: demand.basis,
                };
            })
            .filter(Boolean)
            .sort((a, b) => {
                const order = { Critical: 0, High: 1, Normal: 2 };
                return order[a.priority] - order[b.priority];
            });

        res.status(200).json({ success: true, count: suggestions.length, data: suggestions });
    } catch (error) {
        console.error('generateSuggestions error:', error);
        res.status(500).json({ error: error.message });
    }
};