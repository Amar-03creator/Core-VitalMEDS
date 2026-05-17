const BillingPage = () => {
  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Billing</h1>

      <div className="rounded-2xl bg-white p-4 shadow">
        <p className="font-semibold">Pending Payments</p>
        <p className="text-slate-500 mt-1">
          Manage invoices, dues and payment history.
        </p>
      </div>
    </div>
  );
};

export default BillingPage;