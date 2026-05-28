// components/Admin/Dashboard/constants.js
import { ShoppingCart, ClipboardList, AlertTriangle, Calendar } from 'lucide-react';

export const kpiAlerts = [
  {
    label: 'Pending Orders',
    value: 8,
    icon: ShoppingCart,
    text: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    link: '/admin-dashboard/orders',
  },
  {
    label: 'Open Inquiries',
    value: 5,
    icon: ClipboardList,
    text: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    link: '/admin-dashboard/orders',
  },
  {
    label: 'Low Stock Items',
    value: 3,
    icon: AlertTriangle,
    text: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    link: '/admin-dashboard/inventory',
  },
  {
    label: 'Near Expiry',
    value: 7,
    icon: Calendar,
    text: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    link: '/admin-dashboard/inventory',
  },
];

export const financialData = {
  month: {
    sales: { value: '₹8,40,000', label: 'Total Sales', sub: '+14% vs last month', positive: true },
    collection: { value: '₹6,12,500', label: 'Total Collection', sub: '73% recovery rate', positive: true },
    outstanding: { value: '₹2,10,500', label: 'Total Outstanding', sub: '14 parties overdue', positive: false },
  },
  year: {
    sales: { value: '₹68,40,000', label: 'Total Sales', sub: '+22% vs last year', positive: true },
    collection: { value: '₹57,20,000', label: 'Total Collection', sub: '84% recovery rate', positive: true },
    outstanding: { value: '₹2,10,500', label: 'Total Outstanding', sub: '14 parties overdue', positive: false },
  },
};

export const topPartiesData = {
  volume: [
    { name: 'Sharma Medical Stores', tier: 'Diamond', value: '₹1,20,000', score: 88, meta: 'this month' },
    { name: 'City Pharma', tier: 'Platinum', value: '₹84,500', score: 72, meta: 'this month' },
    { name: 'HealthFirst Pharmacy', tier: 'Gold', value: '₹62,000', score: 95, meta: 'this month' },
    { name: 'MedCare Stores', tier: 'Gold', value: '₹43,500', score: 65, meta: 'this month' },
  ],
  speed: [
    { name: 'HealthFirst Pharmacy', tier: 'Gold', value: '5 days', score: 95, meta: 'avg pay time' },
    { name: 'Apollo Medicals', tier: 'Diamond', value: '8 days', score: 91, meta: 'avg pay time' },
    { name: 'City Pharma', tier: 'Platinum', value: '11 days', score: 72, meta: 'avg pay time' },
    { name: 'Sharma Medical Stores', tier: 'Diamond', value: '14 days', score: 88, meta: 'avg pay time' },
  ],
  mvp: [
    { name: 'Apollo Medicals', tier: 'Diamond', value: '91/100', score: 91, meta: 'credit score' },
    { name: 'HealthFirst Pharmacy', tier: 'Gold', value: '95/100', score: 95, meta: 'credit score' },
    { name: 'Sharma Medical Stores', tier: 'Diamond', value: '88/100', score: 88, meta: 'credit score' },
    { name: 'City Pharma', tier: 'Platinum', value: '72/100', score: 72, meta: 'credit score' },
  ],
};

export const concernedParties = [
  { name: 'Ravi Drug House', outstanding: '₹78,000', days: 62, tier: 'Silver', score: 22 },
  { name: 'Patnaik Medicals', outstanding: '₹34,500', days: 45, tier: 'Gold', score: 38 },
  { name: 'New Life Pharmacy', outstanding: '₹21,000', days: 38, tier: 'Silver', score: 31 },
];

export const topProducts = [
  { name: 'Paracetamol 500mg', company: 'Cipla', sold: 3200, revenue: '₹38,400' },
  { name: 'Cetirizine 10mg', company: 'Mankind', sold: 1850, revenue: '₹24,050' },
  { name: 'Omeprazole 20mg', company: "Dr. Reddy's", sold: 1400, revenue: '₹31,500' },
  { name: 'Metformin 500mg', company: 'USV', sold: 980, revenue: '₹14,700' },
  { name: 'Amoxicillin 250mg', company: 'Cipla', sold: 870, revenue: '₹12,180' },
];

export const tierColorsLight = {
  Diamond: 'bg-cyan-100 text-cyan-700',
  Platinum: 'bg-slate-100 text-slate-600',
  Gold: 'bg-amber-100 text-amber-700',
  Silver: 'bg-gray-100 text-gray-600',
};