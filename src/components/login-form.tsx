"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle, Shield } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(undefined); setPending(true);
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({ email: String(form.get("email")), password: String(form.get("password")), callbackURL: "/dashboard" });
    setPending(false);
    if (result.error) { setError("Email atau password tidak valid."); return; }
    router.push("/dashboard"); router.refresh();
  }
  return <main className="auth-page"><section className="auth-panel"><div className="brand-mark"><Shield size={18} /></div><p className="eyebrow" style={{ marginTop: 22 }}>Administrator access</p><h1 className="page-title">Sign in to Aegis Control</h1><p className="page-description">Use your organization administrator account to access the security workspace.</p><form onSubmit={submit} style={{ display: "grid", gap: 14, marginTop: 26 }}><div className="field"><label htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" inputMode="email" autoComplete="email" required placeholder="name@company.com" /></div><div className="field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required /></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="button primary" type="submit" disabled={pending}>{pending ? <LoaderCircle size={14} className="spin" /> : <KeyRound size={14} />}{pending ? "Signing in…" : "Sign in"}</button></form><p className="auth-footnote">Access is logged and restricted by organization role.</p></section></main>;
}
