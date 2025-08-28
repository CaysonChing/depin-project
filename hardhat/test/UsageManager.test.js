const { expect } = require("chai");

describe("UsageManager functionality testing", function() {

    let deployer, deviceOwner, user;
    let registry, usageManager;
    let registryAsOwner, usageManagerAsUser, usageManagerAsDeviceOwner;

    const sessionFee = 10n**16n;    //0.01ether
    const deviceAddr = "0x000000000000000000000000000000000000dEaD";

    before(async function() {
        const wallets = await hre.viem.getWalletClients();
        [deployer, deviceOwner, user] = wallets;

        // Deploy DeviceRegistry
        registry = await hre.viem.deployContract("DeviceRegistry", [deployer.account.address],{
            client: deployer,
        });

        // Deploy UsageManager
        usageManager = await hre.viem.deployContract(
            "UsageManager",
            [deployer.account.address, registry.address, sessionFee],
            {client: deployer}
        );

        console.log("DeviceRegistry deployed at:", registry.address);
        console.log("UsageManager deployed at:", usageManager.address);

        // Register a device (by deviceOwner) in registry
        registryAsOwner = await hre.viem.getContractAt("DeviceRegistry", registry.address, deviceOwner);
        await registryAsOwner.write.registerDevice([
            deviceAddr,
            deviceOwner.account.address,
            "sensor",
            "pubkey123",
        ],{
            account: deviceOwner.account
        });

        // UsageManager connections
        usageManagerAsUser = await hre.viem.getContractAt("UsageManager", usageManager.address, user);
        usageManagerAsDeviceOwner = await hre.viem.getContractAt("UsageManager", usageManager.address, deviceOwner);

        console.log("Deployer: ", deployer.account.address);
        console.log("Device Owner: ", deviceOwner.account.address);
        console.log("User: ", user.account.address);
    });

    it("should start a session", async function(){

        const hash = await usageManagerAsUser.write.startSession(
            [deviceAddr],{
            account: user.account,
            value: sessionFee
        });

        expect(hash).to.be.a("string");

        const sessionId = await usageManager.read.activeSessionOfDevice([deviceAddr]);
        expect(sessionId).to.not.equal("0x" + "0".repeat(64));

        const session = await usageManager.read.getSession([sessionId]);
        console.log("Session:", session);
        expect(session.user.toLowerCase()).to.equal(user.account.address.toLowerCase());    //user
        expect(session.device.toLowerCase()).to.equal(deviceAddr.toLowerCase());    //device
        expect(session.active).to.equal(true);  // state

        console.log("Session started:", sessionId, " with fee of ", sessionFee.toString());

    });

    it("should end session", async function(){

        const sessionId = await usageManager.read.activeSessionOfDevice([deviceAddr]);

        await usageManagerAsDeviceOwner.write.endSession([sessionId],{ account: user.account});

        const session = await usageManager.read.getSession([sessionId]);
        expect(session.active).to.equal(false);

        const balance = await usageManager.read.getBalance([deviceOwner.account.address]);
        expect(balance).to.equal(sessionFee);

        console.log("Session ended, balance credited:", balance.toString());
    })

    it("should allow device owner to withdraw earnings", async function(){

        const publicClient = await hre.viem.getPublicClient();

        const beforeBal = await publicClient.getBalance({
            address: deviceOwner.account.address,
        });

        await usageManagerAsDeviceOwner.write.withdraw([deviceAddr], {account: deviceOwner.account});

        const afterBal = await publicClient.getBalance({
            address: deviceOwner.account.address,
        });

        expect(afterBal > beforeBal).to.equal(true);

        const newContractBalance = await usageManager.read.getBalance([deviceOwner.account.address]);
        expect(newContractBalance).to.equal(0n);

        console.log("Withdrawal successful, owner received funds");
    });
});