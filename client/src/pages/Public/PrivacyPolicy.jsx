import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-5 py-10">
        <Link
          to="/register"
          className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-sm mb-6 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Registration
        </Link>

        <h1 className="text-slate-900 text-3xl font-black mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-8">Last updated: 28 July 2026</p>

        <div className="prose prose-slate max-w-none bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
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
      </div>
    </div>
  );
};

export default PrivacyPolicy;