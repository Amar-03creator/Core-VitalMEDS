import React, { useEffect } from 'react';
import { 
  ShieldCheck, 
  MessageSquareText, 
  ShoppingCart, 
  RefreshCcw, 
  PackageSearch, 
  Truck, 
  FileCheck2,
  Tag
} from 'lucide-react';

const HowOrderingWorks = () => {
  useEffect(() => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, []);
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 mb-10">
        <h1 className="text-3xl font-black text-slate-900">How Ordering Works</h1>
        <p className="text-slate-500 text-base max-w-2xl mx-auto">
          Welcome to the platform! Here is everything you need to know about setting up your account, requesting quotes, and receiving your inventory.
        </p>
      </div>

      {/* 1. Onboarding & Verification */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck size={24} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">1. Account Verification</h2>
            <p className="text-slate-500 text-sm">Mandatory compliance step before ordering</p>
          </div>
        </div>
        <div className="text-slate-700 text-sm leading-relaxed space-y-3">
          <p>
            When you first register and log in via your email OTP, your account is in a <strong>Restricted State</strong>. You can browse our catalog, but you cannot place direct orders yet.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>You must upload your mandatory legal documents (Drug License, GSTIN, PAN, etc.) via the Documents tab.</li>
            <li>Our administration team will review these documents.</li>
            <li>Once approved, your account is fully unlocked for Direct Ordering. Until then, you may only submit Price Inquiries.</li>
          </ul>
        </div>
      </section>

      {/* 2. Inquiries vs Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <MessageSquareText size={20} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Price Inquiries</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            If your account is pending approval, or if you want to negotiate pricing on bulk items, you can submit an Inquiry.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2"><strong>1.</strong> You submit requested items and leave a note for the admin.</li>
            <li className="flex gap-2"><strong>2.</strong> Admin reviews and sends back a formal pricing Quote.</li>
            <li className="flex gap-2"><strong>3.</strong> You review the Quote. If accepted (and your account is approved), it instantly converts to a live order.</li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingCart size={20} className="text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Direct Orders</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Fully verified accounts can bypass the inquiry process and place orders directly from the catalog for immediate processing.
          </p>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex gap-2"><strong>1.</strong> Add items to your cart and checkout.</li>
            <li className="flex gap-2"><strong>2.</strong> <strong>Editing Window:</strong> You have 2–3 minutes immediately after placing an order to edit your quantities directly from the Orders page.</li>
            <li className="flex gap-2"><strong>3.</strong> Once the admin begins generating your official invoice, the order is locked and cannot be edited.</li>
          </ul>
        </section>
      </div>

      {/* 3. Cart Dynamics & Offers */}
      <section className="bg-amber-50 rounded-3xl border border-amber-100 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
            <Tag size={24} className="text-amber-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-950">Cart & Special Offers Rules</h2>
            <p className="text-amber-700/80 text-sm">Important notes about stock availability</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white/60 p-4 rounded-2xl border border-amber-200/50">
            <h3 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-1.5">
              <PackageSearch size={16} /> Live Stock Adjustments
            </h3>
            <p className="text-amber-800 text-sm leading-relaxed">
              B2B inventory moves incredibly fast. While an item might show "10 available" when added to your cart, the actual available quantity may drop by the time you click "Order Now". The cart will automatically adjust to the true available stock to prevent backorders.
            </p>
          </div>
          <div className="bg-white/60 p-4 rounded-2xl border border-amber-200/50">
            <h3 className="font-bold text-amber-900 text-sm mb-2 flex items-center gap-1.5">
              <RefreshCcw size={16} /> Standard vs. Offer Batches
            </h3>
            <p className="text-amber-800 text-sm leading-relaxed">
              If you add a standard product to your cart, the system will actively notify you if a special "Offer Batch" exists for that same product. Offer batches typically feature heavy discounts due to shorter expiry dates. You can choose to mix and match standard and offer units as you please!
            </p>
          </div>
        </div>
      </section>

      {/* 4. Tracking & Delivery */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center shrink-0">
            <Truck size={24} className="text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Order Lifecycle & Cancellations</h2>
        </div>
        
        <div className="relative border-l-2 border-slate-100 ml-5 space-y-8 pb-4">
          <div className="relative pl-6">
            <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 border-2 border-white ring-2 ring-blue-100"></div>
            <h3 className="text-sm font-bold text-slate-900">Placed & Invoiced</h3>
            <p className="text-sm text-slate-500 mt-1">Order is received and the official tax invoice is generated. At this stage, you may review the final pricing and still have the option to cancel the order.</p>
          </div>
          <div className="relative pl-6">
            <div className="absolute w-3 h-3 bg-amber-500 rounded-full -left-[7px] top-1.5 border-2 border-white ring-2 ring-amber-100"></div>
            <h3 className="text-sm font-bold text-slate-900">Packed</h3>
            <p className="text-sm text-slate-500 mt-1">Your items are boxed and secured in our warehouse. <strong>Cancellations are no longer permitted from this stage onward.</strong></p>
          </div>
          <div className="relative pl-6">
            <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1.5 border-2 border-white ring-2 ring-indigo-100"></div>
            <h3 className="text-sm font-bold text-slate-900">Shipped</h3>
            <p className="text-sm text-slate-500 mt-1">The order has left our facility. The courier company details and tracking/docket numbers will immediately appear in your dashboard.</p>
          </div>
          <div className="relative pl-6">
            <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1.5 border-2 border-white ring-2 ring-emerald-100"></div>
            <h3 className="text-sm font-bold text-slate-900">Delivered</h3>
            <p className="text-sm text-slate-500 mt-1">Once the goods arrive, either you or the administrative team can mark the order as "Delivered" to close the cycle.</p>
          </div>
        </div>
      </section>

      {/* 5. Document Maintenance */}
      <section className="bg-slate-50 rounded-3xl border border-slate-200 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-slate-200 shadow-sm">
            <FileCheck2 size={24} className="text-slate-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Document Maintenance</h2>
            <p className="text-slate-500 text-sm">Keeping your compliance files up to date</p>
          </div>
        </div>
        <p className="text-slate-700 text-sm leading-relaxed">
          Compliance is a two-way street. At any time, our administration may request updated copies of your licenses if they are nearing expiration or appear illegible. 
          <br /><br />
          Similarly, if you renew a license (e.g., Drug License renewal) and need to upload the new copy, you cannot overwrite approved documents directly. You must submit an <strong>Update Request</strong> via your Documents tab explaining the reason. Once admin approves the request, the upload portal will unlock for your new file.
        </p>
      </section>

    </div>
  );
};

export default HowOrderingWorks;