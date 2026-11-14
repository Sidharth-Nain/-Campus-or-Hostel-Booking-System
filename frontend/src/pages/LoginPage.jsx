import { useState } from "react";

import { useAuth } from "../auth/AuthContext";
import AuthShell from "../components/AuthShell";
import { RouteLink } from "../components/AppLayout";
import { navigate } from "../router";

export default function LoginPage() {
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
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell eyebrow="WELCOME BACK" title="Make room for what matters.">
      <p className="muted">Sign in with the account registered through CampusFlow.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Email address<input name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} placeholder="you@campus.edu" required /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" value={form.password} onChange={updateField} placeholder="At least 8 characters" required /></label>
        {error && <p className="form-message error" role="alert">{error}</p>}
        <button className="button primary" type="submit" disabled={submitting}>{submitting ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="auth-switch">New to CampusFlow? <RouteLink to="/register">Create a student account</RouteLink></p>
    </AuthShell>
  );
}
