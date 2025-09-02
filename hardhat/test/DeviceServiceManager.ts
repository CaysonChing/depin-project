import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { Address, getAddress, parseGwei, decodeEventLog } from "viem";


describe("DeviceUsageManager", function(){

    async function deployFixture(){
        const [deployer, deviceOwner, user] = await hre.viem.getWalletClients();

        // Deploy Contract
        const factory = await hre.viem.deployContract("DeviceUsageManager", [deployer.account.address]);
        const contract = await hre.viem.getContractAt(
            "DeviceUsageManager",
            factory.address
        );

        const publicClient = await hre.viem.getPublicClient();
        // const testClient = await hre.viem.getTestClient();

        console.log("========== All contract and user information ==========")
        console.log("Contract deployed at: ", factory.address);
        console.log("Contract Owner Address: ", deployer.account.address)
        console.log("Device Owner Address: ", deviceOwner.account.address)
        console.log("User Address: ", user.account.address)

        return { contract, deployer, deviceOwner, user, publicClient };
    }

    it("testing DeviceUsageManager Contract", async function(){
        
        const { contract, deployer, deviceOwner, user, publicClient } = await loadFixture(deployFixture);

        console.log("\n\n========== Output for owner setting up contract ==========")

        // Localhost gas fee (in Gwei): 21398.051796036
        const fundAmount = parseGwei("1000000");
        const reward = parseGwei("100000");

        // Contract owner funding contract
        await contract.write.fundContract({
            account: deployer.account,
            value: fundAmount,
        });

        console.log("Contract Owner successfully deposited: ", fundAmount.toString())

        // Contract owner set registartion reward
        await contract.write.setRegistrationReward([reward], {
            account: deployer.account,
        });

        console.log("Registration Reward is set to ", reward.toString());


        console.log("\n\n========== Output for Device Registry ==========")

        // Device information
        const deviceAddress: Address = "0x000000000000000000000000000000000000dEaD";
        const deviceType = "sensor";
        const publicKey = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        const fee = parseGwei("10000");

        // Register Device
        await contract.write.registerDevice([
            deviceAddress,
            deviceOwner.account.address,
            deviceType,
            publicKey,
            fee,
        ], {
            account: deviceOwner.account
        });

        // Check the registration reward has entered the device balance
        let deviceBalance = await contract.read.getDeviceBalance([deviceAddress]);
        const deviceInfo = await contract.read.getDevice([deviceAddress]);

        console.log("Device registered successfully for: ", deviceOwner.account.address);
        console.log("Device Information", deviceInfo);
        console.log("Device currently hold: ", deviceBalance.toString());

        const deviceAddress2: Address = "0x3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1234";
        const deviceType2 = "sensor";
        const publicKey2 = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        const fee2 = parseGwei("10000");

        await contract.write.registerDevice([
            deviceAddress2,
            deviceOwner.account.address,
            deviceType2,
            publicKey2,
            fee2,
        ],{
            account: deviceOwner.account
        })

        let deviceBalance2 = await contract.read.getDeviceBalance([deviceAddress2]);
        const deviceInfo2 = await contract.read.getDevice([deviceAddress2]);

        console.log("Device registered successfully for: ", deviceOwner.account.address);
        console.log("Device Information", deviceInfo2);
        console.log("Device currently hold: ", deviceBalance2.toString());


        console.log("\n\n========== Output for Device Information Update ==========")

        // New Device Information
        const newDeviceType = "camera";
        const newFee = parseGwei("20000");

        // Update Device Information
        await contract.write.updateDeviceInfo([
            deviceAddress,
            newDeviceType,
            newFee,
        ], {
            account: deviceOwner.account
        });

        const updatedDeviceInfo = await contract.read.getDevice([deviceAddress]);

        console.log("Device successfully updated");
        console.log("Updated Device Information", updatedDeviceInfo);


        console.log("\n\n========== Output for Device Owner withdraw  ==========")

        let deviceOwnerBalance = await publicClient.getBalance({
            address: deviceOwner.account.address,
        });

        console.log("Device currently hold: ", deviceBalance.toString());
        console.log("Device owner currently hold: ", deviceOwnerBalance.toString());

        await contract.write.withdraw([
            deviceAddress
        ],{
            account: deviceOwner.account.address
        });

        deviceOwnerBalance = await publicClient.getBalance({
            address: deviceOwner.account.address,
        });
        deviceBalance = await contract.read.getDeviceBalance([deviceAddress]);

        console.log("Withdraw Successful");
        console.log("Device currently hold: ", deviceBalance.toString());     
        console.log("Device owner currently hold: ", deviceOwnerBalance.toString());  


        console.log("\n\n========== User start session  ==========")

        let userBalance = await publicClient.getBalance({
            address: user.account.address,
        });
        console.log("User balance before: ", userBalance.toString());

        const hash = await contract.write.startSession([
            deviceAddress
        ],{
            account: user.account.address,
            value: newFee
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash: hash })

        // decode logs to get sessionId
        const sessionLog = receipt.logs
        .map((log) => {
            try {
                return decodeEventLog({
                    abi: contract.abi,
                    data: log.data,
                    topics: log.topics,
            })
            } catch {
                return null
            }
        })
        .find((l) => l?.eventName === "SessionStarted")

        const sessionId = sessionLog?.args.sessionId as `0x${string}`
        const sessionInfo = await contract.read.getSession([sessionId]);

        console.log("Session successfully started: ", sessionId);
        console.log("Session information:", sessionInfo);

        userBalance = await publicClient.getBalance({
            address: user.account.address,
        });
        console.log("User balance after: ", userBalance.toString());


        console.log("\n\n========== User end session  ==========")

        deviceBalance = await contract.read.getDeviceBalance([deviceAddress]);

        console.log("Device balance before: ", deviceBalance.toString());

        await contract.write.endSession([sessionId], {
            account: user.account.address
        })

        deviceBalance = await contract.read.getDeviceBalance([deviceAddress]);

        console.log("Session Successfully ended");
        console.log("Device balance before: ", deviceBalance.toString());


        console.log("\n\n========== Owner withdraw all  ==========")

        deviceOwnerBalance = await publicClient.getBalance({
            address: deviceOwner.account.address,
        });

        console.log("Device 1 currently hold: ", deviceBalance.toString());
        console.log("Device 2 currently hold: ", deviceBalance2.toString());
        console.log("Device owner currently hold: ", deviceOwnerBalance.toString());

        await contract.write.withdrawAll({account: deviceOwner.account.address})

        deviceOwnerBalance = await publicClient.getBalance({
            address: deviceOwner.account.address,
        });
        
        console.log("Withdraw All Successfull");
        deviceBalance = await contract.read.getDeviceBalance([deviceAddress]);
        deviceBalance2 = await contract.read.getDeviceBalance([deviceAddress2]);

        console.log("Device 1 currently hold: ", deviceBalance.toString());
        console.log("Device 2 currently hold: ", deviceBalance2.toString());
        console.log("Device owner currently hold: ", deviceOwnerBalance.toString());


        console.log("\n\n========== Remove Device Output  ==========")

        // Get total devices left after removal
        const deviceNumBfr = await contract.read.getOwnerDeviceCount([
            deviceOwner.account.address
        ],  {
                account: deviceOwner.account.address,
            }
        )

        console.log("Number of devices before: ", deviceNumBfr);

        await contract.write.removeDevice([deviceAddress2],{
            account: deviceOwner.account.address,
        })

        // Get total devices left after removal
        const deviceNum = await contract.read.getOwnerDeviceCount([
            deviceOwner.account.address
        ],  {
                account: deviceOwner.account.address,
            }
        )

        console.log("Number of devices after: ", deviceNum);

        expect(deviceNum.toString()).to.equal("1", "The number of devices is not 1 after removal");

        console.log("Device removed successfully");


        console.log("\n\n========== Deactivate Device output  ==========");

        let deviceStatus = await contract.read.getDevice([deviceAddress]);

        console.log("Device status before:", deviceStatus[1]);

        await contract.write.updateDeviceStatus([deviceAddress, false],
            {
                account: deviceOwner.account.address
            }
        )

        console.log("Device deactivate successful")
        deviceStatus = await contract.read.getDevice([deviceAddress]);
        console.log("Device status after:", deviceStatus[1]);


        console.log("\n\n========== Activate Device output  ==========");

        deviceStatus = await contract.read.getDevice([deviceAddress]);

        console.log("Device status before:", deviceStatus[1]);

        await contract.write.updateDeviceStatus([deviceAddress, true],
            {
                account: deviceOwner.account.address
            }
        )

        console.log("Device activate successful")
        deviceStatus = await contract.read.getDevice([deviceAddress]);
        console.log("Device status after:", deviceStatus[1]);


        console.log("\n\n========== Heartbeat Output  ==========");

        await contract.write.heartbeat([deviceAddress],{
            account: deviceOwner.account.address,
        })

        console.log("Heartbeat updated")

    });

});