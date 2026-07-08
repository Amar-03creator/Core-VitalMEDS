// src/features/Client/Cart/components/AlertsPanel.jsx
import { AlertTriangle, Info } from 'lucide-react';
import { buildAlerts } from '../utils/alertsBuilder';

const AlertsPanel = ({ items, tierByProductId }) => {
  const alerts = buildAlerts(items, tierByProductId);
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert, idx) => (
        <div
          key={idx}
          className={`flex items-start gap-2 rounded-xl px-3 py-2.5 border ${
            alert.type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-100'
          }`}
        >
          {alert.type === 'warning' ? (
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          )}
          <p className={`text-xs sm:text-sm ${alert.type === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}>
            <span className="font-semibold">{alert.type === 'warning' ? 'Warning: ' : 'Note: '}</span>
            {alert.text}
          </p>
        </div>
      ))}
    </div>
  );
};

export default AlertsPanel;