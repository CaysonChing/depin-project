import hre from "hardhat";
import { deployContract } from "viem/actions";

async function main() {

    // Get the public and wallet clients from Hardhat's runtime environment
    const [deployer] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    console.log("Deploying contracts with the account:", deployer.account.address);

    // Use publicClient to get the balance, as it's a read-only operation
    const balance = await publicClient.getBalance({ address: deployer.account.address });
    console.log("Account balance:", balance.toString());

    // DeviceRegistry address (because i accidentally deployed it)
    const deviceRegistryAddress: `0x${string}` = "0x88269c203704e7936c6ebc5cbca83d47cfbd543b";

    // // Deploy DeviceRegistry contract
    // // Read the compiled contract's artifact to get its bytecode and ABI
    // const deviceRegistryArtifact = await hre.artifacts.readArtifact("DeviceRegistry");

    // // Deploy the contract
    // const deviceRegistryHash = await deployContract(deployer, {
    //     abi: deviceRegistryArtifact.abi as any,
    //     bytecode: deviceRegistryArtifact.bytecode as `0x${string}`,
    //     args: [deployer.account.address],
    // });

    // // Wait for the deployment transaction to be confirmed 
    // const deviceRegistryReceipt = await publicClient.waitForTransactionReceipt({ hash: deviceRegistryHash });
    // const deviceRegistryAddress = deviceRegistryReceipt.contractAddress;
    // console.log("DeviceRegistry deployed to:", deviceRegistryAddress);

    // Deploy UsageManager contract
    // Read UsageManager artifact
    const usageManagerArtifact = await hre.artifacts.readArtifact("UsageManager");

    const initialFeeInWei = BigInt("10000000000000000"); // 0.01 in wei

    const usageManagerHash = await deployContract( deployer, {
        abi: usageManagerArtifact.abi as any,
        bytecode: usageManagerArtifact.bytecode as `0x${string}`,
        args: [
            deployer.account.address,
            deviceRegistryAddress,
            initialFeeInWei
        ],
    });

    // Wait for the deployment transaction to be confirmed
    const usageManagerReceipt = await publicClient.waitForTransactionReceipt({ hash: usageManagerHash });
    const usageManagerAddress = usageManagerReceipt.contractAddress;   
    console.log("UsageManager deployed to:", usageManagerAddress);
}

// Call main function and handle errors
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });