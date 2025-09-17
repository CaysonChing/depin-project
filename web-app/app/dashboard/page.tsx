import { getSupabaseServerClient } from "@/app/lib/supabaseServer";
import ConnectWallet from "@/components/ConnectWallet";
import WalletCheck from "@/components/WalletCheck";
import WalletInfo from "@/components/WalletInfo";

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

          <div style={{marginTop: 20}}>
            Wallet checked passed. display content
          </div>
          
        </WalletCheck>
        
      </div>
  );
}
