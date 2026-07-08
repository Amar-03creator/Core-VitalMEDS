// client/src/layouts/ClientLayout/components/constants.js
import { CheckCircle2, Truck, FileText, ShoppingCart, AlertTriangle, Package } from 'lucide-react';

// Last 10 — swap for a real API call ordered by newest first.
export const demoClientNotifications = [
  { id: 1, unread: true, icon: CheckCircle2, iconBg: 'bg-emerald-500', title: 'Order Delivered', text: 'Your order #ORD-2291 has been delivered successfully.', time: '10m ago' },
  { id: 2, unread: true, icon: Truck, iconBg: 'bg-blue-500', title: 'Order Shipped', text: 'Your order #ORD-2290 is out for delivery.', time: '45m ago' },
  { id: 3, unread: true, icon: FileText, iconBg: 'bg-violet-500', title: 'New Invoice', text: 'Invoice INV-1042 of ₹8,450 has been generated.', time: '2h ago' },
  { id: 4, unread: false, icon: ShoppingCart, iconBg: 'bg-emerald-500', title: 'Order Confirmed', text: 'Your order #ORD-2288 has been confirmed.', time: '5h ago' },
  { id: 5, unread: false, icon: AlertTriangle, iconBg: 'bg-amber-500', title: 'Payment Due', text: 'An outstanding payment of ₹12,000 is due in 3 days.', time: '1d ago' },
  { id: 6, unread: false, icon: Package, iconBg: 'bg-slate-500', title: 'Inquiry Answered', text: 'Mila Agencies replied to your price inquiry.', time: '1d ago' },
  { id: 7, unread: false, icon: CheckCircle2, iconBg: 'bg-emerald-500', title: 'Order Delivered', text: 'Your order #ORD-2280 has been delivered successfully.', time: '2d ago' },
  { id: 8, unread: false, icon: FileText, iconBg: 'bg-violet-500', title: 'New Invoice', text: 'Invoice INV-1035 of ₹5,120 has been generated.', time: '3d ago' },
  { id: 9, unread: false, icon: ShoppingCart, iconBg: 'bg-emerald-500', title: 'Order Confirmed', text: 'Your order #ORD-2274 has been confirmed.', time: '4d ago' },
  { id: 10, unread: false, icon: AlertTriangle, iconBg: 'bg-amber-500', title: 'Drug License Reminder', text: 'Your Drug License is expiring in 20 days.', time: '5d ago' },
];