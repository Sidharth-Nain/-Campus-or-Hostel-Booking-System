import { useState } from "react";

import { useAuth } from "../auth/AuthContext";
import { BRAND_NAME } from "../brand";
import AuthShell from "../components/AuthShell";
import { RouteLink } from "../components/AppLayout";
import { authRoute } from "../router";

export default function LoginPage({ returnRoute }) {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(form);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell eyebrow="WELCOME BACK" title="Your next space awaits.">
      <p className="muted">Sign in to {BRAND_NAME} to reserve a seat or manage your bookings.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Email address<input name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} placeholder="you@campus.edu" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" value={form.password} onChange={updateField} placeholder="At least 8 characters" required /></label>
        {error && <p className="form-message error" role="alert">{error}</p>}
        <button className="button primary" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="auth-switch">New to {BRAND_NAME}? <RouteLink to={authRoute("/register", returnRoute)}>Create a student account</RouteLink></p>
    </AuthShell>
  );
}
