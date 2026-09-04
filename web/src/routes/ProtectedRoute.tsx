import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth, WEB_ALLOWED_ROLES } from "../context/AuthContext";
import { getMySubscriptionStatus, BLOCKED_SUBSCRIPTION_STATUSES, type ClubSubscriptionStatus } from "../lib/api/subscriptionStatus";
import SubscriptionPendingPage from "./SubscriptionPendingPage";

export default function ProtectedRoute() {
  const { session, role, loading, signOut } = useAuth();
  const [subscription, setSubscription] = useState<ClubSubscriptionStatus | null>(null);

  useEffect(() => {
    if (role !== "club_admin") {
      setSubscription(null);
      return;
    }
    let cancelled = false;
    getMySubscriptionStatus().then((s) => { if (!cancelled) setSubscription(s); });
    return () => { cancelled = true; };
  }, [role]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-muted">
        Yükleniyor…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !WEB_ALLOWED_ROLES.includes(role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-6 text-center">
        <p className="text-lg font-bold text-ink">Bu panel yalnızca yönetim ekibi içindir.</p>
        <p className="text-sm text-muted">
          Antrenör, veli ve sporcu hesapları X-NETIC mobil uygulamasını kullanmaya devam etmeli.
        </p>
        <button
          onClick={() => signOut()}
          className="rounded-lg bg-yellow px-4 py-2 text-sm font-bold text-bg"
        >
          Çıkış Yap
        </button>
      </div>
    );
  }

  if (role === "club_admin" && subscription && BLOCKED_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
    return (
      <SubscriptionPendingPage
        status={subscription.status}
        billingPeriod={subscription.billingPeriod}
        amountTry={subscription.amountTry}
      />
    );
  }

  return <Outlet />;
}
