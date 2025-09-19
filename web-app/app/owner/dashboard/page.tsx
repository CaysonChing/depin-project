import { getSupabaseServerClient } from "@/app/lib/supabaseServer";
import ConnectWallet from "@/components/wallet/ConnectWallet";
import WalletCheck from "@/components/wallet/WalletCheck";
import ContractManager from "@/components/contract/ContractManager";

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

      <WalletCheck expectedWallet={profile.wallet_address}>
        <div className="ps-50 p-20 justify-center">
          <h1 className="text-2xl font-bold mb-4">Manage Contract</h1>

          <div className="mt-3">
            <ConnectWallet />
          </div>

          <div className="flex mt-4">
            <ContractManager isOwner={profile.is_contract_owner} />
          </div>
        </div>
      </WalletCheck>
    </div>
  );
}
