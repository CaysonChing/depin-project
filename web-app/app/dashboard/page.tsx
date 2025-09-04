import { cookies } from "next/headers";
import { supabase } from "@/app/lib/supabaseClient";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>You are not logged in. <a href="/auth/login" className="text-blue-500">Go to login</a></p>
      </div>
    );
  }

  // Optionally: verify token with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Session expired. <a href="/auth/login" className="text-blue-500">Login again</a></p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-700"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
