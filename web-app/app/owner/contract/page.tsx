import { getSupabaseServerClient } from "@/app/lib/supabaseServer";

export default async function DashboardPage() {
  const supabaseServer = await getSupabaseServerClient();
  const { data: profile, error } = await supabaseServer
    .from("users")
    .select("*")
    .single();

  if (error || !profile) {
    return <p>Could not load profile.</p>;
  }

  return (
      <div className="p-6">
        <h1>Contract settings here</h1>
      </div>

  );
}
