// components/Admin/Layout/constants.js
import { UserPlus, ClipboardList, ShoppingCart, AlertTriangle, Shield, MessageSquare } from 'lucide-react';

export const demoNotifications = [
  { id: 1, unread: true, icon: UserPlus, iconBg: 'bg-blue-500', title: 'New Registration', text: 'Patnaik Medicals is waiting for approval.', time: '5m ago', link: '/admin-dashboard/customers', actionLabel: 'Review' },
  { id: 2, unread: true, icon: ClipboardList, iconBg: 'bg-violet-500', title: 'New Inquiry', text: 'Sharma Medical Stores requested a price quote.', time: '18m ago', link: '/admin-dashboard/orders', actionLabel: 'View' },
  { id: 3, unread: true, icon: ShoppingCart, iconBg: 'bg-emerald-500', title: 'New Order', text: 'City Pharma placed an order for ₹12,400.', time: '45m ago', link: '/admin-dashboard/orders', actionLabel: 'View' },
  { id: 4, unread: false, icon: AlertTriangle, iconBg: 'bg-amber-500', title: 'Compliance Alert', text: "HealthFirst Pharmacy's Drug License expires in 7 days.", time: '2h ago', link: '/admin-dashboard/customers', actionLabel: 'View' },
  { id: 5, unread: false, icon: Shield, iconBg: 'bg-red-500', title: 'Security Alert', text: 'Unrecognized login attempt blocked.', time: '3h ago', link: '/admin-dashboard/support', actionLabel: null },
];

export const demoTickets = [
  { id: 'TKT-041', unread: true, categoryLabel: 'Order Issue', categoryColor: 'bg-red-200 text-red-800', pharmacy: 'Ravi Drug House', text: 'Wrong products received.', time: '12m ago', status: 'open' },
  { id: 'TKT-040', unread: true, categoryLabel: 'Billing', categoryColor: 'bg-amber-200 text-amber-800', pharmacy: 'Sharma Medical', text: 'UPI payment not reflecting.', time: '1h ago', status: 'open' },
  { id: 'TKT-039', unread: false, categoryLabel: 'General', categoryColor: 'bg-slate-200 text-slate-800', pharmacy: 'City Pharma', text: 'Update delivery address.', time: '3h ago', status: 'seen' },
  { id: 'TKT-038', unread: false, categoryLabel: 'Order Issue', categoryColor: 'bg-red-200 text-red-800', pharmacy: 'MedCare Stores', text: 'Missing strips.', time: '5h ago', status: 'seen' },
  { id: 'TKT-037', unread: false, categoryLabel: 'Billing', categoryColor: 'bg-amber-200 text-amber-800', pharmacy: 'New Life Pharmacy', text: 'Invoice incorrect.', time: '1d ago', status: 'resolved' },
];