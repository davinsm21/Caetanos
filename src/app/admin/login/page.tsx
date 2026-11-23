"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) { setError("Configure as variáveis públicas do Supabase."); setBusy(false); return; }
    const supabase = createBrowserClient(url, key);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    if (authError) { setError("Não foi possível entrar. Verifique suas credenciais."); setBusy(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.app_metadata?.role !== "admin") {
      await supabase.auth.signOut();
      setError("Esta conta não tem permissão para acessar o painel.");
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }
  return <section className="admin-login"><p className="section-kicker">ÁREA DA EQUIPE</p><h1>Acesso administrativo</h1><form className="booking-form" onSubmit={submit}><label>E-mail<input name="email" type="email" required autoComplete="username" /></label><label>Senha<input name="password" type="password" required autoComplete="current-password" /></label><button className="button" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>{error && <p className="form-message" role="alert">{error}</p>}</form></section>;
}
