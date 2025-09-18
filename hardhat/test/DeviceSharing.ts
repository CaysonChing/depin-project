import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { Address, getAddress, parseGwei, decodeEventLog } from "viem";

describe("DeviceSharing", function () {
  async function deployFixture() {
    const [deployer, deviceOwner, user] = await hre.viem.getWalletClients();

    const factory = await hre.viem.deployContract("DeviceSharing", [
      deployer.account.address,
    ]);
    const contract = await hre.viem.getContractAt(
      "DeviceSharing",
      factory.address
    );

    const publicClient = await hre.viem.getPublicClient();

    console.log("========== All contract and user information ==========");
    console.log("Contract deployed at: ", factory.address);
    console.log("Contract Owner Address: ", deployer.account.address);
    console.log("Device Owner Address: ", deviceOwner.account.address);
    console.log("User Address: ", user.account.address);

    return { contract, deployer, deviceOwner, user, publicClient };
  }

  it("Test DeviceSharing Contract", async function () {
    const { contract, deployer, deviceOwner, user, publicClient } =
      await loadFixture(deployFixture);

    console.log(
      "\n\n========== Output for owner setting up contract =========="
    );

    // Localhost gas fee (in Gwei): 21398.051796036
    const fundAmount = parseGwei("1000000");
    const reward = parseGwei("100000");

    // Contract owner funding contract
    await contract.write.fundContract({
      account: deployer.account,
      value: fundAmount,
    });

    console.log(
      "Contract Owner successfully deposited: ",
      fundAmount.toString()
    );

    // Contract owner set registartion reward
    await contract.write.setRegistrationReward([reward], {
      account: deployer.account,
    });

    console.log("Registration Reward is set to ", reward.toString());

    console.log("\n\n========== Register Device ==========");

    // Device Information
    const device_id = "device_01";
    const feePerDay = parseGwei("10000");

    let deviceOwnerBalance = await publicClient.getBalance({
      address: deviceOwner.account.address,
    });

    console.log("Owner currenty hold: ", deviceOwnerBalance.toString());

    // Register Device
    await contract.write.registerDevice([device_id, feePerDay], {
      account: deviceOwner.account,
    });

    let deviceInfo = await contract.read.getDeviceByStringID([device_id]);

    deviceOwnerBalance = await publicClient.getBalance({
      address: deviceOwner.account.address,
    });

    console.log(
      "Device registered successfully for: ",
      deviceOwner.account.address
    );

    console.log("Device Information", deviceInfo);

    console.log("Owner currenty hold: ", deviceOwnerBalance.toString());

    console.log("\n\n========== Update Device ==========");

    const newFee = parseGwei("50000");

    await contract.write.updateDevice([device_id, newFee], {
      account: deviceOwner.account,
    });

    deviceInfo = await contract.read.getDeviceByStringID([device_id]);

    console.log("Device Information", deviceInfo);

    // console.log("\n\n========== Change Device Status ==========");

    // await contract.write.changeDeviceStatus([device_id, false], {
    //   account: deviceOwner.account,
    // });

    // deviceInfo = await contract.read.getDeviceByStringID([device_id]);

    // console.log("Device Information", deviceInfo);

    // console.log("\n\n========== Remove Device ==========");

    // await contract.write.removeDevice([device_id], {
    //   account: deviceOwner.account,
    // });

    // try {
    //   deviceInfo = await contract.read.getDeviceByStringID([device_id]);
    // } catch (e) {
    //   console.log("No device found");
    // }

    console.log("\n\n========== Subscribe ==========");

    deviceOwnerBalance = await publicClient.getBalance({
      address: deviceOwner.account.address,
    });

    let userBalance = await publicClient.getBalance({
      address: user.account.address,
    }); 

    console.log("Device Owner currenty hold: ", deviceOwnerBalance.toString());
    console.log("User currenty hold: ", userBalance.toString());

    await contract.write.subscribe([device_id, 0],{
        account: user.account,
        value: newFee
    });

    console.log("Subscribed!");

    deviceOwnerBalance = await publicClient.getBalance({
      address: deviceOwner.account.address,
    });

    userBalance = await publicClient.getBalance({
      address: user.account.address,
    }); 

    console.log("Device Owner currenty hold: ", deviceOwnerBalance.toString());
    console.log("User currenty hold: ", userBalance.toString());


    console.log("\n\n========== Subscription info ==========")

    let subscriptionInfo = await contract.read.getSubscriptionById([1n],{})

    console.log("Subscription info:", subscriptionInfo);


    console.log("\n\n========== Is subscription active ==========");

    let response = await contract.read.isSubscriptionActive([1n],{})

    console.log("Subscription active?:", response);

    console.log("\n\n========== Expire subscription ==========");

    await contract.write.expireSubscription([1n],{
        account: user.account.address,
    });

    response = await contract.read.isSubscriptionActive([1n],{})

    console.log("Subscription info:", response);

    console.log("\n\n========== Subscription info ==========")

    subscriptionInfo = await contract.read.getSubscriptionById([1n],{})

    console.log("Subscription info:", subscriptionInfo);

  });
});
