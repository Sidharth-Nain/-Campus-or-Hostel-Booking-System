export default function AuthShell({ children, eyebrow, title }) {
  return (
    <section className="auth-screen">
      <div className="auth-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children}
      </div>
      <aside className="auth-aside">
        <div className="auth-aside-content">
          <span className="photo-label">ONE CAMPUS · EVERY SPACE</span>
          <h2>From quiet study sessions to big campus moments.</h2>
          <p>Use one account to discover spaces, request bookings, and follow every decision.</p>
          <div className="auth-proof"><strong>12+</strong><span>campus spaces<br />ready to discover</span></div>
        </div>
      </aside>
    </section>
  );
}
