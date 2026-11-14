import { useState } from "react";

import { useAuth } from "../auth/AuthContext";
import AuthShell from "../components/AuthShell";
import { RouteLink } from "../components/AppLayout";
import { navigate } from "../router";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ full_name: form.full_name, email: form.email, password: form.password });
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell eyebrow="CREATE YOUR ACCOUNT" title="Your campus starts here.">
      <p className="muted">Student accounts can request spaces and track their booking status.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Full name<input name="full_name" autoComplete="name" value={form.full_name} onChange={updateField} placeholder="Aarav Sharma" minLength="2" required /></label>
        <label>Email address<input name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} placeholder="you@campus.edu" required /></label>
        <div className="password-row">
          <label>Password<input name="password" type="password" autoComplete="new-password" value={form.password} onChange={updateField} placeholder="8+ characters" minLength="8" required /></label>
          <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={updateField} placeholder="Repeat password" minLength="8" required /></label>
        </div>
        {error && <p className="form-message error" role="alert">{error}</p>}
        <button className="button primary" type="submit" disabled={submitting}>{submitting ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="auth-switch">Already registered? <RouteLink to="/login">Sign in</RouteLink></p>
    </AuthShell>
  );
}
