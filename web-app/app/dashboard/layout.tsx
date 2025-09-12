import Navbar from "@/components/Navbar";
import { cookies } from "next/headers";
import { supabase } from "@/app/lib/supabaseClient";
import "../globals.css";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) {
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

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>
          Session expired.{" "}
          <a href="/auth/login" className="text-blue-500">
            Login again
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Navbar />

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
