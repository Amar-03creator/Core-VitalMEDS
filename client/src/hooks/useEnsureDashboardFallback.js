// src/hooks/useEnsureDashboardFallback.js
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const FLAG_KEY = 'vmHasNavigated';

/**
 * Guarantees the back button always has somewhere sane to land.
 *
 * If the FIRST screen the user sees in this tab is already deep in the app
 * (refresh, deep link, PWA relaunch to last screen) rather than Dashboard,
 * a single back press would otherwise exit straight to the OS/PWA host.
 * This splices a Dashboard entry underneath the current one so back always
 * has a page to return to first.
 *
 * Runs once per tab session. Standard in-app back navigation (Customers ->
 * Dashboard, etc.) is untouched — React Router's own history already
 * handles that correctly; we only need to guard the cold-start case.
 * Pressing back while ALREADY on Dashboard falls through to native
 * behavior (background/close the PWA), since Dashboard is then genuinely
 * the bottom of the stack.
 */
export const useEnsureDashboardFallback = (dashboardPath) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem(FLAG_KEY)) return;
    sessionStorage.setItem(FLAG_KEY, '1');

    if (location.pathname !== dashboardPath) {
      const currentFullPath = location.pathname + location.search;
      navigate(dashboardPath, { replace: true });
      navigate(currentFullPath, { replace: false });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once per tab session, intentionally
};