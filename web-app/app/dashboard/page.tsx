import { getSupabaseServerClient } from "@/app/lib/supabaseServer";

export default async function DashboardPage() {

  const supabaseServer = await getSupabaseServerClient();

  const { data: profile, error } = await supabaseServer
    .from("users")
    .select("*")
    .single();

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Could not load user profile.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {profile.username}</h1>
    </div>
  );
}
