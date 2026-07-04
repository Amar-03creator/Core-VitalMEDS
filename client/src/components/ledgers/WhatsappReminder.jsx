export const WhatsAppReminder = ({ partyName, outstanding, days }) => {
  if (outstanding <= 0) return null;

  const message = encodeURIComponent(
    `Dear ${partyName}, your outstanding balance of ₹${outstanding.toLocaleString('en-IN')} for bills older than ${days} days is pending. Kindly clear the dues. - Mila Agencies.`
  );

  return (
    <a
      href={`https://wa.me/?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1.5 text-sm font-bold text-emerald-700 bg-emerald-100/50 border border-emerald-200 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
    >
      📱 Send WhatsApp Reminder
    </a>
  );
};