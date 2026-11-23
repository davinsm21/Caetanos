import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { AdminDashboard } from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return <section className="admin-page"><h1>Configure o Supabase para abrir o painel.</h1></section>;
  const cookieStore = await cookies();
  const auth = createServerClient(url, key, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } });
  const { data: { user } } = await auth.auth.getUser();
  if (user?.app_metadata?.role !== "admin") return null;
  const admin = getSupabaseAdmin();
  if (!admin) return <section className="admin-page"><h1>Configure o Supabase para abrir o painel.</h1></section>;
  const [
    { data: stays, error: staysError },
    { data: bookings, error: bookingsError },
    { data: content, error: contentError },
    { data: blockedDates, error: blockedError }
  ] = await Promise.all([
    admin.from("accommodations").select("*").order("name"),
    admin.from("bookings").select("*, accommodations(name)").order("created_at", { ascending: false }).limit(50),
    admin.from("home_content").select("*").order("section, key"),
    admin.from("blocked_dates").select("*, accommodations(name)").order("date")
  ]);
  if (staysError || bookingsError || contentError || blockedError) console.error("Falha ao carregar dados do painel:", staysError?.message, bookingsError?.message, contentError?.message, blockedError?.message);
  return <AdminDashboard stays={stays || []} bookings={bookings || []} content={content || []} blockedDates={blockedDates || []} email={user.email || ""} />;
}
