import { getSupabaseServerClient } from "@/app/lib/supabaseServer";
import WalletCheck from "@/components/wallet/WalletCheck";
import DeviceList from "@/components/device/DeviceList";
import RegisterDeviceBtn from "@/components/device/RegisterDeviceBtn";

export default async function DashboardPage() {
  const supabaseServer = await getSupabaseServerClient();
  const { data: profile, error } = await supabaseServer
    .from("users")
    .select("*")
    .single();

  if (error || !profile) {
    return <p>Could not load profile.</p>;
  }

  const { data: devices, error: devicesError } = await supabaseServer
    .from("devices")
    .select("*")
    .eq("owner_id", profile.id);

  if (devicesError) {
    console.error(devicesError);
    return <p>Could not load devices.</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{profile.username} &apos;s Devices</h1>

      <WalletCheck expectedWallet={profile.wallet_address}>
        <div className="mt-6">
          <RegisterDeviceBtn />
        </div>

        <div className="mt-2 p-2">
          <DeviceList devices={devices || []} />
        </div>
      </WalletCheck>
    </div>
  );
}
