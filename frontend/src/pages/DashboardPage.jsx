import { useAuth } from "../auth/AuthContext";
import { RouteLink } from "../components/AppLayout";

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user.full_name.split(" ")[0];
  const action = {
    student: ["Make a study routine", "Reserve the same numbered seat for a fixed term.", "/plans", "Explore seat passes"],
    teacher: ["Plan your next class", "Request a whole classroom or hall with the equipment you need.", "/teaching", "Find teaching rooms"],
    admin: ["Review booking requests", "See which students and teachers are waiting for a decision.", "/admin/bookings", "Open review queue"],
  }[user.role];

  return (
    <section className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <p className="eyebrow">{user.role} workspace</p>
          <h1>Good to see you, <em>{firstName}.</em></h1>
          <p>{user.role === "admin" ? "Manage campus spaces and decide who gets to use them." : "Find the space you need and keep track of your requests."}</p>
        </div>
      </div>
      <div className="dashboard-grid">
        <article className="profile-card card">
          <span className="profile-avatar">{user.full_name.slice(0, 2).toUpperCase()}</span>
          <div><p className="eyebrow">SIGNED-IN PROFILE</p><h2>{user.full_name}</h2><p>{user.email}</p></div>
          <span className="role-badge">{user.role}</span>
        </article>
        <article className="next-step-card card">
          <h2>{action[0]}</h2>
          <p>{action[1]}</p>
          <RouteLink className="inline-link" to={action[2]}>{action[3]}</RouteLink>
        </article>
      </div>
    </section>
  );
}
