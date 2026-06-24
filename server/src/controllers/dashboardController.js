const mongoose = require('mongoose');
const SalesInvoice = require('../models/SalesInvoice');
const PaymentReceipt = require('../models/PaymentReceipt');
const Client = require('../models/Client');
const Batch = require('../models/Batch');
// const Order = require('../models/Order'); // Uncomment when you have an Order model

exports.getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    
    // Time Boundaries
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);

    // --- 1. KPI ALERTS ---
    const nearExpiryCount = await Batch.countDocuments({ nearExpiry: true, totalStockQuantity: { $gt: 0 } });
    const lowStockCount = await Batch.countDocuments({ totalStockQuantity: { $lte: 10, $gt: 0 } }); // Adjust threshold as needed
    // Mocking orders since schema wasn't provided, adjust logic once you add Order model
    const pendingOrdersCount = 0; // await Order.countDocuments({ status: 'Pending' }); 
    const openInquiriesCount = 0; // await Inquiry.countDocuments({ status: 'Open' });

    // --- 2. FINANCIAL SNAPSHOT ---
    const getFinancials = async (start, end) => {
      const [sales] = await SalesInvoice.aggregate([
        { $match: { invoiceDate: { $gte: start, $lte: end }, invoiceStatus: { $ne: 'CANCELLED' } } },
        { $group: { _id: null, total: { $sum: '$netAmount' } } }
      ]);
      const [collections] = await PaymentReceipt.aggregate([
        { $match: { paymentDate: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$totalAmountPaid' } } }
      ]);
      return { sales: sales?.total || 0, collections: collections?.total || 0 };
    };

    const [thisMonthFin, lastMonthFin, thisYearFin, lastYearFin] = await Promise.all([
      getFinancials(startOfMonth, endOfMonth),
      getFinancials(startOfLastMonth, endOfLastMonth),
      getFinancials(startOfYear, endOfYear),
      getFinancials(startOfLastYear, endOfLastYear)
    ]);

    // Outstanding snapshot is current time, not historical
    const [outstandingStats] = await Client.aggregate([
      { $group: { _id: null, total: { $sum: '$totalOutstanding' }, count: { $sum: { $cond: [{ $gt: ['$totalOutstanding', 0] }, 1, 0] } } } }
    ]);
    const outstandingTotal = outstandingStats?.total || 0;
    const outstandingCount = outstandingStats?.count || 0;

    // Helper for percentage change
    const calcGrowth = (current, previous) => previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
    const calcRecovery = (collected, sold) => sold === 0 ? 0 : Math.round((collected / sold) * 100);

    const financials = {
      month: {
        sales: { value: thisMonthFin.sales, sub: `${calcGrowth(thisMonthFin.sales, lastMonthFin.sales)}% vs last month`, positive: thisMonthFin.sales >= lastMonthFin.sales },
        collection: { value: thisMonthFin.collections, sub: `${calcRecovery(thisMonthFin.collections, thisMonthFin.sales)}% recovery rate`, positive: true },
        outstanding: { value: outstandingTotal, sub: `${outstandingCount} parties overdue`, positive: false }
      },
      year: {
        sales: { value: thisYearFin.sales, sub: `${calcGrowth(thisYearFin.sales, lastYearFin.sales)}% vs last year`, positive: thisYearFin.sales >= lastYearFin.sales },
        collection: { value: thisYearFin.collections, sub: `${calcRecovery(thisYearFin.collections, thisYearFin.sales)}% recovery rate`, positive: true },
        outstanding: { value: outstandingTotal, sub: `${outstandingCount} parties overdue`, positive: false }
      }
    };

    // --- 3. TOP PRODUCTS (This Month & This Year) ---
    const getTopProducts = async (start, end) => {
      return SalesInvoice.aggregate([
        { $match: { invoiceDate: { $gte: start, $lte: end }, invoiceStatus: { $ne: 'CANCELLED' } } },
        { $unwind: '$items' },
        { $group: { 
            _id: '$items.productId', 
            name: { $first: '$items.productName' }, 
            company: { $first: '$items.companyShortCode' }, 
            sold: { $sum: '$items.billedQty' }, 
            revenue: { $sum: '$items.lineTotal' } 
        }},
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]);
    };
    const [topProductsMonth, topProductsYear] = await Promise.all([
      getTopProducts(startOfMonth, endOfMonth),
      getTopProducts(startOfYear, endOfYear)
    ]);

    // --- 4. TOP PARTIES ---
    const topPartiesVolume = await SalesInvoice.aggregate([
      { $match: { invoiceDate: { $gte: startOfMonth, $lte: endOfMonth }, invoiceStatus: { $ne: 'CANCELLED' } } },
      { $group: { _id: '$clientObjectId', name: { $first: '$clientName' }, value: { $sum: '$netAmount' } } },
      { $sort: { value: -1 } },
      { $limit: 4 },
      { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'clientInfo' } },
      { $unwind: '$clientInfo' },
      { $project: { name: 1, value: 1, tier: { $ifNull: ['$clientInfo.partyTier', 'Silver'] }, score: { $ifNull: ['$clientInfo.creditScore', 50] } } }
    ]);

    const topPartiesSpeed = await Client.find({ averagePaymentTime: { $gt: 0 } }).sort({ averagePaymentTime: 1 }).limit(4).select('establishmentName partyTier averagePaymentTime creditScore');
    const topPartiesMVP = await Client.find({ creditScore: { $gt: 0 } }).sort({ creditScore: -1 }).limit(4).select('establishmentName partyTier creditScore');

    // --- 5. CONCERNED PARTIES ---
    const concernedPartiesRaw = await Client.find({ totalOutstanding: { $gt: 0 } }).select('establishmentName totalOutstanding outstandingDate partyTier creditScore');
    const concernedParties = concernedPartiesRaw.map(c => {
      const days = c.outstandingDate ? Math.floor((now - c.outstandingDate) / (1000 * 60 * 60 * 24)) : 0;
      return { name: c.establishmentName, outstanding: c.totalOutstanding, days, tier: c.partyTier || 'Silver', score: c.creditScore || 50 };
    }).sort((a, b) => b.days - a.days).slice(0, 5); // Top 5 oldest debts

    res.status(200).json({
      success: true,
      data: {
        kpis: { pendingOrders: pendingOrdersCount, openInquiries: openInquiriesCount, lowStock: lowStockCount, nearExpiry: nearExpiryCount },
        financials,
        topProducts: { month: topProductsMonth, year: topProductsYear },
        topParties: {
          volume: topPartiesVolume.map(p => ({ name: p.name, tier: p.tier, value: `₹${p.value.toLocaleString('en-IN')}`, score: p.score, meta: 'this month' })),
          speed: topPartiesSpeed.map(p => ({ name: p.establishmentName, tier: p.partyTier, value: `${p.averagePaymentTime} days`, score: p.creditScore || 50, meta: 'avg pay time' })),
          mvp: topPartiesMVP.map(p => ({ name: p.establishmentName, tier: p.partyTier, value: `${p.creditScore}/100`, score: p.creditScore, meta: 'credit score' }))
        },
        concernedParties: concernedParties.map(p => ({ ...p, outstanding: `₹${p.outstanding.toLocaleString('en-IN')}` }))
      }
    });

  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ message: error.message });
  }
};