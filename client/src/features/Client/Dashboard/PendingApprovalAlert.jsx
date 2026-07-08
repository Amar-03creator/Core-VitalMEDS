// components/PendingAlert.jsx
import { AlertTriangle } from 'lucide-react';

const PendingApprovalAlert = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 flex items-start gap-3">
      <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-amber-800 text-base font-semibold">Account Under Review</p>
        <p className="text-amber-700 text-sm mt-0.5">
          You can browse products but cannot place orders until your account is approved.
        </p>
      </div>
    </div>
  );
};

export default PendingApprovalAlert;