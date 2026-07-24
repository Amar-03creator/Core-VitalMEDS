// src/features/Client/BillingPage/tabs/SummaryTab.jsx
import MonthlySummary from '../../Dashboard/MonthlySummary';
import { useClientBillingSummary } from '../hooks/useClientBillingSummary';

const SummaryTab = ({ client }) => {
  const { summary, loading, error, refetch } = useClientBillingSummary(client?._id);

  const startDate = client?.createdAt
    ? { year: new Date(client.createdAt).getFullYear(), month: new Date(client.createdAt).getMonth() }
    : { year: new Date().getFullYear(), month: new Date().getMonth() };

  if (loading) return <p className="text-slate-400 text-base sm:text-lg text-center py-16">Loading summary…</p>;

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 text-base sm:text-lg">{error}</p>
        <button onClick={refetch} className="text-slate-500 text-sm sm:text-base underline mt-2">Retry</button>
      </div>
    );
  }

  return <MonthlySummary summaryData={summary} startDate={startDate} currentDate={new Date()} />;
};

export default SummaryTab;