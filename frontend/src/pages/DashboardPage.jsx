import { API_BASE_URL } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user.full_name.split(" ")[0];

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">AUTHENTICATED STUDENT AREA</p>
          <h1>Good to see you, <em>{firstName}.</em></h1>
          <p>Your React frontend is connected to the CampusFlow API and your session is protected with a JWT.</p>
        </div>
        <span className="connection-badge"><i />API connected</span>
      </div>
      <div className="dashboard-grid">
        <article className="profile-card card">
          <span className="profile-avatar">{user.full_name.slice(0, 2).toUpperCase()}</span>
          <div><p className="eyebrow">SIGNED-IN PROFILE</p><h2>{user.full_name}</h2><p>{user.email}</p></div>
          <span className="role-badge">{user.role}</span>
        </article>
        <article className="next-step-card card">
          <p className="eyebrow">NEXT PROJECT STEP</p>
          <h2>Live facility screens</h2>
          <p>The facility list and detail screens will be connected to API data in the next scheduled frontend task.</p>
        </article>
      </div>
      <p className="api-note">Connected locally to <code>{API_BASE_URL}</code></p>
    </section>
  );
}
