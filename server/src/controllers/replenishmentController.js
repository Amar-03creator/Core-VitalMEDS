


const mongoose = require('mongoose');
const Product = require('../models/Product');
const SalesInvoice = require('../models/SalesInvoice');

const DEFAULT_LOOKBACK_YEARS = 3;
const MAX_LOOKBACK_YEARS = 5;
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function buildProductMatch(companyIds) {
    const match = {};
    const ids = Array.isArray(companyIds) ? companyIds : (companyIds ? [companyIds] : []);
    const wantsAll = ids.length === 0 || ids.includes('all');
    if (!wantsAll) {
        match.companyId = { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) };
    }
    return match;
}

function defaultSeasonMonths() {
    const now = new Date();
    const months = [];
    for (let i = 0; i < 3; i++) {
        months.push(((now.getMonth() + i) % 12) + 1);
    }
    return months;
}

async function computeVelocityDemand(productIds, months) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

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

    const map = new Map();
    agg.forEach((row) => {
        map.set(String(row._id), {
            totalQty: row.totalQty,
            perMonth: row.totalQty / months,
            basis: `Avg of last ${months} months`,
        });
    });
    return map;
}

async function computeSeasonalDemand(productIds, seasonMonths, lookbackYears) {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 1; i <= lookbackYears; i++) years.push(currentYear - i);

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
        { $match: { month: { $in: seasonMonths }, year: { $in: years } } },
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

    const seasonLabel = seasonMonths.map((m) => MONTH_LABELS[m - 1]).join('-');

    const map = new Map();
    agg.forEach((row) => {
        const avgPerSeason = row.totalQty / Math.max(1, row.yearsSeen);
        map.set(String(row._id), {
            totalQty: row.totalQty,
            perMonth: avgPerSeason / seasonMonths.length,
            basis: `${row.yearsSeen}-yr seasonal avg (${seasonLabel})`,
        });
    });
    return map;
}

function priorityFor(currentStock, perMonth) {
    if (currentStock === 0) return 'Critical';
    if (perMonth > 0 && currentStock < perMonth * 0.5) return 'High';
    return 'Normal';
}

// ---------------------------------------------------------------------------
// main handler
// ---------------------------------------------------------------------------

exports.generateSuggestions = async (req, res) => {
    try {
        const {
            companyIds,
            useVelocity = true,
            useSeasonal = false,
            velocityMonths,
            seasonMonths,
            seasonLookbackYears,
            stockCoverMonths,
        } = req.body;

        if (!useVelocity && !useSeasonal) {
            return res.status(400).json({ message: "You must evaluate at least one strategy." });
        }

        const coverMonths = parseFloat(stockCoverMonths) || 1;
        const lookbackYears = Math.min(parseInt(seasonLookbackYears, 10) || DEFAULT_LOOKBACK_YEARS, MAX_LOOKBACK_YEARS);
        const vMonths = parseInt(velocityMonths, 10) || 2;
        const sMonths = Array.isArray(seasonMonths) && seasonMonths.length > 0 ? seasonMonths.map(Number) : defaultSeasonMonths();

        const productMatch = buildProductMatch(companyIds);
        const products = await Product.find(productMatch).lean();
        if (products.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }
        const productIds = products.map((p) => p._id);

        let velocityMap = new Map();
        let seasonalMap = new Map();

        if (useVelocity) velocityMap = await computeVelocityDemand(productIds, vMonths);
        if (useSeasonal) seasonalMap = await computeSeasonalDemand(productIds, sMonths, lookbackYears);

        const suggestions = products.map((p) => {
            const key = String(p._id);
            const v = velocityMap.get(key) || null;
            const s = seasonalMap.get(key) || null;

            if (!v && !s) return null;

            let chosenPerMonth = 0;
            let basis = null;

            const vDemand = v ? v.perMonth : 0;
            const sDemand = s ? s.perMonth : 0;

            if (useVelocity && useSeasonal) {
                if (sDemand > vDemand) {
                    chosenPerMonth = sDemand;
                    basis = `${s.basis} (Higher than recent trend)`;
                } else {
                    chosenPerMonth = vDemand;
                    basis = `${v.basis} (Higher than seasonal avg)`;
                }
            } else if (useVelocity) {
                chosenPerMonth = vDemand;
                basis = v.basis;
            } else if (useSeasonal) {
                chosenPerMonth = sDemand;
                basis = s.basis;
            }

            if (chosenPerMonth <= 0) return null;

            const currentStock = p.totalStock || 0;
            
            // The absolute formula: (Average Monthly Sales * 2 * Coverage) - Current Stock
            const projectedDemand = Math.round(chosenPerMonth * 2 * coverMonths);
            const suggestedQty = Math.max(0, projectedDemand - currentStock);
            
            if (suggestedQty <= 0) return null;

            return {
                productId: p._id,
                productName: p.name,
                companyId: p.companyId,
                companyName: p.company, // Fallback
                currentStock,
                avgMonthlyDemand: Math.round(chosenPerMonth),
                projectedDemand,
                suggestedQty,
                finalQty: suggestedQty,
                priority: priorityFor(currentStock, chosenPerMonth),
                basis,
            };
        }).filter(Boolean).sort((a, b) => {
            const order = { Critical: 0, High: 1, Normal: 2 };
            return order[a.priority] - order[b.priority];
        });

        res.status(200).json({
            success: true,
            params: {
                companyIds: companyIds && companyIds.length ? companyIds : 'all',
                useVelocity,
                useSeasonal,
                stockCoverMonths: coverMonths,
            },
            count: suggestions.length,
            data: suggestions,
        });
    } catch (error) {
        console.error('generateSuggestions error:', error);
        res.status(500).json({ error: error.message });
    }
};