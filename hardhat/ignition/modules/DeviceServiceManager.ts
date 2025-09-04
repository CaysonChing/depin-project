// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeviceUsageManagerModule = buildModule("DeviceUsageManagerModule", (m) => {
  // Deployment parameters
  const initialOwner = m.getParameter("initialOwner", m.getAccount(0));
  const callSetReward = m.getParameter("callSetReward", false);
  const registrationReward = m.getParameter("registrationReward", "0");

  // Deploy the contract with the initialOwner
  const deviceUsageManager = m.contract("DeviceUsageManager", [initialOwner]);

  return { deviceUsageManager };
});

export default DeviceUsageManagerModule;
