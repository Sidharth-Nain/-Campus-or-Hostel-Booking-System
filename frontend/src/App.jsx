import { useEffect } from "react";

import { useAuth } from "./auth/AuthContext";
import AppLayout from "./components/AppLayout";
import AdminFacilitiesPage from "./pages/AdminFacilitiesPage";
import DashboardPage from "./pages/DashboardPage";
import FacilityDetailPage from "./pages/FacilityDetailPage";
import FacilityListPage from "./pages/FacilityListPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { navigate, useRoute } from "./router";

export default function App() {
  const route = useRoute();
  const { checkingSession, isAuthenticated } = useAuth();

  useEffect(() => {
    if (checkingSession) return;
    const protectedRoute = route === "/dashboard" || route === "/facilities" || route === "/admin/facilities" || /^\/facilities\/\d+$/.test(route);
    const knownRoute = protectedRoute || route === "/login" || route === "/register";
    if (protectedRoute && !isAuthenticated) navigate("/login");
    if ((route === "/login" || route === "/register") && isAuthenticated) navigate("/dashboard");
    if (!knownRoute) {
      navigate(isAuthenticated ? "/dashboard" : "/login");
    }
  }, [checkingSession, isAuthenticated, route]);

  if (checkingSession) {
    return <div className="app-loading"><span className="loader" />Checking your CampusFlow session…</div>;
  }

  let page = null;
  if (route === "/login" && !isAuthenticated) page = <LoginPage />;
  if (route === "/register" && !isAuthenticated) page = <RegisterPage />;
  if (route === "/dashboard" && isAuthenticated) page = <DashboardPage />;
  if (route === "/facilities" && isAuthenticated) page = <FacilityListPage />;
  if (route === "/admin/facilities" && isAuthenticated) page = <AdminFacilitiesPage />;
  if (/^\/facilities\/\d+$/.test(route) && isAuthenticated) {
    page = <FacilityDetailPage facilityId={route.split("/").at(-1)} />;
  }

  return <AppLayout>{page}</AppLayout>;
}
