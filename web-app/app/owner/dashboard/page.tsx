import { getSupabaseServerClient } from "@/app/lib/supabaseServer";
import ConnectWallet from "@/components/wallet/ConnectWallet";
import WalletCheck from "@/components/wallet/WalletCheck";

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
      <h1 className="text-2xl font-bold mb-4">Welcome, {profile.username}</h1>

      <div className="mt-3">
        <ConnectWallet />
      </div>

      <WalletCheck expectedWallet={profile.wallet_address}>
        <div style={{ marginTop: 20 }}>
          Wallet checked passed. display content
        </div>
      </WalletCheck>
    </div>
  );
}
