import { useAuth } from "../auth/AuthContext";
import { BRAND_LOGO_URL, BRAND_NAME } from "../brand";
import { navigate, useRoute } from "../router";
import CampusMotion from "./CampusMotion";

function RouteLink({ children, className = "", to, ...props }) {
  return (
    <a
      {...props}
      className={className}
      href={`#${to}`}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export default function AppLayout({ children }) {
  const { isAuthenticated, signOut, user } = useAuth();
  const route = useRoute();

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  return (
    <div className="site-shell">
      <CampusMotion variant="site" />
      <header className="topbar">
        <RouteLink className="brand" to="/" aria-label={`${BRAND_NAME} home`}>
          <img className="brand-mark" src={BRAND_LOGO_URL} alt="" width="38" height="38" />
          <span>Campus <span className="brand-accent">Flow</span></span>
        </RouteLink>
        <nav aria-label="Primary navigation">
          <RouteLink className={route.startsWith("/facilities") ? "active" : ""} to="/facilities">Spaces</RouteLink>
          <RouteLink className={route === "/teaching" ? "active" : ""} to="/teaching">Teaching rooms</RouteLink>
          {user?.role !== "admin" && <RouteLink className={route.startsWith("/plans") ? "active" : ""} to="/plans">Seat passes</RouteLink>}
          {isAuthenticated ? (
            <>
              {user.role !== "admin" && <RouteLink className={route === "/bookings" ? "active" : ""} to="/bookings">My bookings</RouteLink>}
              {user.role === "admin" && <RouteLink className={route === "/admin/bookings" ? "active" : ""} to="/admin/bookings">Requests</RouteLink>}
              {user.role === "admin" && <RouteLink className={route === "/admin/facilities" ? "active" : ""} to="/admin/facilities">Manage spaces</RouteLink>}
              <button className="nav-button" type="button" onClick={handleSignOut}>Sign out</button>
            </>
          ) : (
            <>
              <RouteLink to="/login">Sign in</RouteLink>
              <RouteLink className="nav-cta" to="/register">Create account</RouteLink>
            </>
          )}
        </nav>
        {isAuthenticated && (
          <RouteLink className="account-chip" to="/dashboard" aria-label="Open dashboard">
            <span>{user.full_name.slice(0, 2).toUpperCase()}</span>
            <small>{user.full_name}</small>
          </RouteLink>
        )}
      </header>
      <main>{children}</main>
      <footer>
        <div><strong>{BRAND_NAME}</strong><span>Campus booking, from a single seat to a whole hall.</span></div>
        <RouteLink to="/plans">Explore seat passes</RouteLink>
      </footer>
    </div>
  );
}

export { RouteLink };
