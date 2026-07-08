// features/Client/Dashboard/Greeting.jsx
const getTierSubtext = (tier) => {
  switch (tier) {
    case 'Diamond': return 'Elite volume partner';
    case 'Platinum': return 'Premium volume partner';
    case 'Gold': return 'Consistent buyer';
    case 'Silver': return 'Valued client';
    default: return 'Registered client';
  }
};

const Greeting = ({ owner, tier, isApproved }) => {
  const firstName = owner.slice(0, owner.indexOf(' ')) || owner;

  return (
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-400 text-lg font-bold">Welcome</p>
        <h1 className="text-slate-900 text-3xl font-bold">{firstName} 👋</h1>
      </div>

      {isApproved && (
        <div className="flex flex-col items-end text-right py-1">
          <span className={`text-base font-black px-4 py-1.5 rounded-xl shadow-sm
            ${tier === 'Diamond' ? 'bg-cyan-100 text-cyan-700' :
              tier === 'Platinum' ? 'bg-slate-200 text-slate-700' :
                tier === 'Gold' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'}`}
          >
            💎 {tier}
          </span>
          <span className="text-sm text-slate-500 font-semibold mt-1 tracking-wide">
            {getTierSubtext(tier)}
          </span>
        </div>
      )}
    </div>
  );
};

export default Greeting;