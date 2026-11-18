import { useAuth } from "../auth/AuthContext";
import { navigate, useRoute } from "../router";

function RouteLink({ children, className = "", to }) {
  return (
    <a
      className={className}
      href={`#${to}`}
      onClick={(event) => {
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
    navigate("/login");
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <RouteLink className="brand" to={isAuthenticated ? "/dashboard" : "/login"}>
          <span className="brand-mark">CF</span>
          <span>CampusFlow</span>
          <small>Space booking</small>
        </RouteLink>
        <nav aria-label="Primary navigation">
          {isAuthenticated ? (
            <>
              <RouteLink className={route === "/dashboard" ? "active" : ""} to="/dashboard">Dashboard</RouteLink>
              <RouteLink className={route.startsWith("/facilities") ? "active" : ""} to="/facilities">Facilities</RouteLink>
              {user.role === "student" && <RouteLink className={route === "/bookings" ? "active" : ""} to="/bookings">My bookings</RouteLink>}
              {user.role === "admin" && <RouteLink className={route === "/admin/bookings" ? "active" : ""} to="/admin/bookings">Requests</RouteLink>}
              {user.role === "admin" && <RouteLink className={route === "/admin/facilities" ? "active" : ""} to="/admin/facilities">Spaces</RouteLink>}
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
          <div className="account-chip" title={user.email}>
            <span>{user.full_name.slice(0, 2).toUpperCase()}</span>
            <small>{user.full_name}</small>
          </div>
        )}
      </header>
      <main>{children}</main>
      <footer>
        <div><strong>CampusFlow</strong><span>Making campus spaces easier to access.</span></div>
        <p>React frontend · Live FastAPI data</p>
      </footer>
    </div>
  );
}

export { RouteLink };
