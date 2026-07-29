// src/features/Common/Registration/LegalModal.jsx
import { X } from 'lucide-react';

const TERMS_CONTENT = (
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
);

const PRIVACY_CONTENT = (
  <div className="prose prose-sm max-w-none text-slate-600 space-y-3">
    <h2>1. Information We Collect</h2>
    <p>
      When you register, we collect your pharmacy’s establishment name, owner/proprietor name, business type, GSTIN, PAN, Aadhaar number, drug license numbers,
      email address, mobile number, and business address. We also collect documents you upload (GST certificate, drug license copies) which are stored securely.
    </p>
    <p>
      While using the platform, we log order history, inquiry details, invoice data, and payment records to provide the service.
    </p>

    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>To verify your identity and eligibility to purchase pharmaceutical products (KYC compliance)</li>
      <li>To create and manage your account, process orders, and generate GST invoices</li>
      <li>To communicate with you regarding orders, payments, quotes, and account status</li>
      <li>To improve our platform and provide customer support</li>
      <li>To comply with legal obligations under applicable Indian laws</li>
    </ul>

    <h2>3. Data Sharing & Third Parties</h2>
    <p>
      We do not sell your personal data. We may share your information only under these circumstances:
    </p>
    <ul>
      <li><strong>With the distributor (admin):</strong> Your account details, order history, and payment records are visible to the distributor’s staff for business operations.</li>
      <li><strong>Service Providers:</strong> We use Amazon Web Services (AWS) for hosting and email delivery. Your documents are stored in an isolated S3 bucket with access strictly controlled.</li>
      <li><strong>Legal Compliance:</strong> If required by law, we may share data with government authorities (e.g., GST authorities).</li>
    </ul>

    <h2>4. Data Security</h2>
    <p>
      We implement industry-standard security measures: all data is transmitted over HTTPS, files are uploaded via secure presigned URLs (60-second expiry),
      and authentication is handled by Amazon Cognito with JWT tokens. Your password is never stored in plain text.
    </p>

    <h2>5. Data Retention</h2>
    <p>
      We retain your account information as long as your account is active. Invoices and financial records are retained for a minimum of 8 years as per Indian tax laws.
      Support tickets and notification logs are periodically archived or deleted after 12 months.
    </p>

    <h2>6. Your Rights</h2>
    <p>
      You have the right to access, correct, or delete your personal data, subject to legal retention requirements.
      You can update your contact information from your profile, or request a copy of your data by contacting the administrator.
    </p>

    <h2>7. Cookies & Tracking</h2>
    <p>
      VitalMEDS uses only essential session tokens (JWT stored in local storage) for authentication. We do not use third‑party tracking cookies or analytics.
    </p>

    <h2>8. Changes to this Policy</h2>
    <p>
      We may update this policy. Any material changes will be notified via email. Continued use after changes implies acceptance.
    </p>

    <h2>9. Contact Us</h2>
    <p>
      For privacy-related questions, contact the distributor administrator through <strong>milaAgencies@gmail.com</strong>.
    </p>
  </div>
);

const LegalModal = ({ type, onClose }) => {
  const isTerms = type === 'terms';
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 p-1.5 rounded-full"
        >
          <X size={18} />
        </button>
        <h1 className="text-2xl font-black text-slate-900 mb-4">
          {isTerms ? 'Terms of Service' : 'Privacy Policy'}
        </h1>
        <p className="text-slate-500 text-sm mb-6">Last updated: 28 July 2026</p>
        {isTerms ? TERMS_CONTENT : PRIVACY_CONTENT}
        <button
          onClick={onClose}
          className="mt-6 w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl hover:bg-slate-800 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default LegalModal;