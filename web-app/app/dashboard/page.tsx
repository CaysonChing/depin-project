import { getSupabaseServerClient } from "@/app/lib/supabaseServer";
import ConnectWallet from "@/components/wallet/ConnectWallet";
import WalletCheck from "@/components/wallet/WalletCheck";
import WalletInfo from "@/components/wallet/WalletInfo";

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
        <h1 className="text-2xl font-bold">Welcome, {profile.username}</h1>
        
        <div className="mb-4"><WalletInfo /></div>
        <ConnectWallet />

        <WalletCheck expectedWallet={profile.wallet_address}>

          <div className="mt-80">
            Wallet checked passed. display content
          </div>

        </WalletCheck>
        
      </div>
  );
}
