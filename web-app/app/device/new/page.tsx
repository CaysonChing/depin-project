import { getSupabaseServerClient } from "@/app/lib/supabaseServer";
import RegisterDeviceForm from "@/components/device/RegisterDeviceForm";

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
      <h1 className="text-2xl font-bold">Register Device, {profile.username}</h1>
      <div className="mt-4">
        <RegisterDeviceForm owner_id={profile.id} />
      </div>
    </div>
  );
}
