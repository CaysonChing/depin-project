import { getSupabaseServerClient } from "@/app/lib/supabaseServer";
import ContractManager from "@/components/contract/ContractManager";
import ConnectWallet from "@/components/wallet/ConnectWallet";


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
      <div className="ps-50 p-20 justify-center">
        <h1 className="text-2xl font-bold mb-4">Manage Contract</h1>

        <ConnectWallet />

        <div className="flex mt-6">

          <ContractManager isOwner={profile.is_contract_owner} />

        </div>
      </div>

  );
}
