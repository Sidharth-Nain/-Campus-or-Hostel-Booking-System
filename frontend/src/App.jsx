import { useEffect } from "react";

import { useAuth } from "./auth/AuthContext";
import { BRAND_NAME } from "./brand";
import AppLayout from "./components/AppLayout";
import AdminBookingsPage from "./pages/AdminBookingsPage";
import AdminFacilitiesPage from "./pages/AdminFacilitiesPage";
import DashboardPage from "./pages/DashboardPage";
import FacilityDetailPage from "./pages/FacilityDetailPage";
import FacilityListPage from "./pages/FacilityListPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import MyBookingsPage from "./pages/MyBookingsPage";
import PlansPage from "./pages/PlansPage";
import RegisterPage from "./pages/RegisterPage";
import { navigate, safeReturnRoute, useRoute } from "./router";

export default function App() {
  const [route, query] = useRoute().split("?");
  const returnRoute = safeReturnRoute(query);
  const { checkingSession, isAuthenticated } = useAuth();
  const facilityRoute = /^\/facilities\/\d+$/.test(route);
  const plansRoute = route === "/plans" || /^\/plans\/\d+$/.test(route);

  useEffect(() => {
    if (checkingSession) return;
    const protectedRoute = ["/dashboard", "/bookings", "/admin/bookings", "/admin/facilities"].includes(route);
    const knownRoute = protectedRoute || facilityRoute || plansRoute || ["/", "/facilities", "/teaching", "/login", "/register"].includes(route);
    if (protectedRoute && !isAuthenticated) navigate("/login");
    if ((route === "/login" || route === "/register") && isAuthenticated) navigate(returnRoute || "/dashboard");
    if (!knownRoute) navigate("/");
  }, [checkingSession, facilityRoute, isAuthenticated, plansRoute, returnRoute, route]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  if (checkingSession) {
    return <div className="app-loading"><span className="loader" />Checking your {BRAND_NAME} session…</div>;
  }

  let page = null;
  if (route === "/") page = <HomePage />;
  if (route === "/login" && !isAuthenticated) page = <LoginPage returnRoute={returnRoute} />;
  if (route === "/register" && !isAuthenticated) page = <RegisterPage returnRoute={returnRoute} />;
  if (route === "/dashboard" && isAuthenticated) page = <DashboardPage />;
  if (route === "/facilities") page = <FacilityListPage key="all" />;
  if (route === "/teaching") page = <FacilityListPage key="teaching" teachingOnly />;
  if (plansRoute) page = <PlansPage key={route} preferredFacilityId={route.split("/")[2]} />;
  if (route === "/bookings" && isAuthenticated) page = <MyBookingsPage />;
  if (route === "/admin/bookings" && isAuthenticated) page = <AdminBookingsPage />;
  if (route === "/admin/facilities" && isAuthenticated) page = <AdminFacilitiesPage />;
  if (facilityRoute) {
    page = <FacilityDetailPage key={route} facilityId={route.split("/").at(-1)} />;
  }

  return <AppLayout>{page}</AppLayout>;
}
