import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* Back to Registration */}
        <Link
          to="/register"
          className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-sm mb-6 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Registration
        </Link>

        <h1 className="text-slate-900 text-3xl font-black mb-2">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-8">Last updated: 28 July 2026</p>

        <div className="prose prose-slate max-w-none bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By registering an account with VitalMEDS, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform. VitalMEDS provides a B2B pharmaceutical supply chain platform connecting distributors and retail pharmacy owners.
          </p>

          <h2>2. Account Registration & Verification</h2>
          <p>
            You must provide accurate, complete, and current information during registration (business name, GSTIN, PAN/Aadhaar, drug license numbers). 
            Your mobile number and email will be verified via OTP. Your account remains <strong>Pending</strong> until an administrator verifies the KYC documents you upload. 
            During the pending period, you may browse products but cannot place orders or view pricing.
          </p>

          <h2>3. Document Uploads & KYC</h2>
          <p>
            You are required to upload valid copies of your Drug License, GST Certificate, PAN, and any other documents requested by the distributor. 
            Uploading fraudulent documents may result in permanent suspension. 
            Documents are stored securely using Amazon S3 with restricted access and are only used for compliance verification.
          </p>

          <h2>4. Use of Platform</h2>
          <p>
            Once approved, you may browse products, create inquiries, place orders, and view invoices. 
            All prices shown are wholesale (PTR) and are subject to change based on batch availability and distributor approval.
            The "Short Expiry" badge indicates products nearing expiry; by ordering such items you accept the reduced shelf life and the associated discount.
          </p>

          <h2>5. Ordering & Payment</h2>
          <p>
            Orders are binding commitments to purchase. The distributor reserves the right to adjust quantities, allocate batches, or cancel orders due to stock shortages.
            Invoices are generated with GST-compliant details. Payments are allocated using the FIFO (First-In-First-Out) method, settling the oldest outstanding bills first.
            Late payments may incur interest as per the agreed credit terms, and your credit score may be affected.
          </p>

          <h2>6. Intellectual Property</h2>
          <p>
            All content on VitalMEDS, including product images, pricing algorithms, and software code, is the property of VitalMEDS or its licensors.
            You may not copy, distribute, or reverse-engineer any part of the platform.
          </p>

          <h2>7. Limitation of Liability</h2>
          <p>
            VitalMEDS acts solely as a technology enabler. The distributor is responsible for the quality, delivery, and legality of the pharmaceutical products.
            We are not liable for any indirect, incidental, or consequential damages arising from the use of the platform, including delays or data inaccuracies.
          </p>

          <h2>8. Termination</h2>
          <p>
            The administrator may suspend or terminate your account if you violate these terms, provide false documents, or default on payments. 
            You may request account deletion by contacting support, subject to any outstanding financial obligations.
          </p>

          <h2>9. Changes to Terms</h2>
          <p>
            We may update these terms at any time. Significant changes will be communicated via email or in-app notification. 
            Continued use of the platform after changes constitutes acceptance of the revised terms.
          </p>

          <h2>10. Governing Law</h2>
          <p>
            These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Cuttack, Odisha.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;