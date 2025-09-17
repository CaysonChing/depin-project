import Navbar from "@/components/Navbar";
import { getSupabaseServerClient } from "@/app/lib/supabaseServer";
import "../globals.css";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let supabaseServer;

  try {
    supabaseServer = await getSupabaseServerClient();
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>
          You are not logged in.{" "}
          <a href="/auth/login" className="text-blue-500">
            Go to login
          </a>
        </p>
      </div>
    );
  }

  const { data: profile, error: profileError } = await (await supabaseServer)
    .from("users")
    .select("*")
    .single();

  if (!profile || profileError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Failed to load profile.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Navbar isOwner={profile.is_contract_owner} />

          <main className="flex-1 p-6">{children}</main>

    </div>
  );
}
