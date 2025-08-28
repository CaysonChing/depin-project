const { expect } = require("chai");

// Test Wallet Connection
// describe("Viem Wallet Connection", function () {
//     let deployer, deviceOwner, user;

//     it("should get wallet clients and check addresses", async function () {
//         // Get wallets
//         const wallets = await hre.viem.getWalletClients();
//         [deployer, deviceOwner, user] = wallets;

//         // Check that each wallet has an address
//         expect(deployer.account.address).to.be.a("string");
//         expect(deviceOwner.account.address).to.be.a("string");
//         expect(user.account.address).to.be.a("string");

//         console.log("Deployer address:", deployer.account.address);
//         console.log("DeviceOwner address:", deviceOwner.account.address);
//         console.log("User address:", user.account.address);
//     });
// });

// Test Contract Deployment
// describe("Viem Contract Deployment", function () {
//     let deployer;
//     let registry;

//     it("should deploy DeviceRegistry contract", async function () {
//         // Get deployer wallet
//         [deployer] = await hre.viem.getWalletClients();

//         // Deploy the contract
//         registry = await hre.viem.deployContract("DeviceRegistry", [deployer.account.address], {
//             client: deployer,
//         });

//         // Check if deployment returned an address
//         expect(registry.address).to.be.a("string");

//         console.log("DeviceRegistry deployed at:", registry.address);
//     });

//     it("should deploy UsageManager contract", async function () {
//         // Constructor args: deployer address, registry address, sessionFee
//         const sessionFee = 10n ** 16n; // 0.01 ether

//         usageManager = await hre.viem.deployContract(
//             "UsageManager",
//             [deployer.account.address, registry.address, sessionFee],
//             { client: deployer }
//         );

//         // Check deployment
//         expect(usageManager.address).to.be.a("string");
//         console.log("UsageManager deployed at:", usageManager.address);
//     });

// });

describe("DeviceRegistry functionality testing", function () {
    let deployer, deviceOwner;
    let registry, registryAsOwner;
    const deviceAddr = "0x000000000000000000000000000000000000dEaD";    // Hard coded device address for testing purposes

    before(async function () {
        const wallets = await hre.viem.getWalletClients();
        [deployer, deviceOwner] = wallets;

        // Deploy DeviceRegistry
        registry = await hre.viem.deployContract("DeviceRegistry", [deployer.account.address], {
            client: deployer,
        });
        console.log("DeviceRegistry deployed at:", registry.address);

        // Connect deviceOwner to DeviceRegistry
        registryAsOwner = await hre.viem.getContractAt("DeviceRegistry", registry.address, deviceOwner);

    });

    it("should allow deviceOwner to register a device", async function () {

        await registryAsOwner.write.registerDevice([
            deviceAddr,
            deviceOwner.account.address,
            "sensor",
            "pubkey123",
        ], {
            account: deviceOwner.account
        });

        const device = await registryAsOwner.read.getDeviceInformation([deviceAddr]);
        expect(device[0].toLowerCase()).to.equal(deviceOwner.account.address); // owner
        expect(device[1]).to.equal(true);                       // isActive
        expect(device[2]).to.equal("sensor");                   // deviceType
        expect(device[4]).to.equal("pubkey123");                // pubKey
        console.log("Device registered successfully for:", deviceOwner.account.address);
    });


    it("should allow deviceOwner to update device status", async function () {

        await registryAsOwner.write.updateDeviceStatus([deviceAddr, false], {
            client: deviceOwner,
        });

        // Viem returns the transaction details directly
        // You can now check the state of the contract instead of events
        const isActive = await registryAsOwner.read.isDeviceActive([deviceAddr]);
        expect(isActive).to.equal(false);
        console.log("Device state successfully changed to", isActive);

    });

    it("should update device heartbeat", async function () {

        await registryAsOwner.write.heartbeat([deviceAddr]);

        const device = await registryAsOwner.read.getDeviceInformation([deviceAddr]);
        const lastSeen = device[3];

        // Normalize to BigInt safely
        let lastSeenBigInt;
        if (typeof lastSeen === "bigint") {
            lastSeenBigInt = lastSeen;
        } else if (typeof lastSeen === "string") {
            lastSeenBigInt = BigInt(lastSeen);
        } else { // number (or other)
            lastSeenBigInt = BigInt(Math.floor(Number(lastSeen)));
        }

        expect(lastSeenBigInt > 0n).to.equal(true);

        const lastSeenMs = Number(lastSeenBigInt) * 1000;
        const lastSeenDate = new Date(lastSeenMs);

        console.log("Device heartbeat recorded, last seen (unix sec):", lastSeenBigInt.toString());
        console.log("Device heartbeat recorded, last seen (ISO):", lastSeenDate.toISOString());

    });

    it("should allow deviceOwner to update device info", async function() {
        await registryAsOwner.write.updateDeviceInfo([
            deviceAddr,
            "camera",
            "newpubkey456",
        ],{
            account: deviceOwner.account
        });

        const device = await registryAsOwner.read.getDeviceInformation([deviceAddr]);

        expect(device[2]).to.equal("camera");
        expect(device[4]).to.equal("newpubkey456");
        
        console.log("Device info updated:", device[2], device[4]);
    });

    it("should allow owner/deviceOwner to remove the device", async function(){

        await registryAsOwner.write.removeDevice([deviceAddr]);

        const isActive = await registry.read.isDeviceActive([deviceAddr]);

        expect(isActive).to.equal(false);
        console.log("Device successfully removed, isActive:", isActive);
    });

});


