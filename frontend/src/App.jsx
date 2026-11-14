import { useEffect } from "react";

import { useAuth } from "./auth/AuthContext";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { navigate, useRoute } from "./router";

export default function App() {
  const route = useRoute();
  const { checkingSession, isAuthenticated } = useAuth();

  useEffect(() => {
    if (checkingSession) return;
    if (route === "/dashboard" && !isAuthenticated) navigate("/login");
    if ((route === "/login" || route === "/register") && isAuthenticated) navigate("/dashboard");
    if (!["/login", "/register", "/dashboard"].includes(route)) {
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

  return <AppLayout>{page}</AppLayout>;
}
